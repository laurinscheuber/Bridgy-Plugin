# Technische Zusammenfassung für Bachelorarbeit: "DesignSync" (Bridgy)

## 1. Architektur-Übersicht

Das Projekt folgt einer **Service-orientierten Architektur (SOA)** innerhalb des Figma-Plugin-Ökosystems, die eine strikte Trennung zwischen der UI-Logik (Frontend) und der Geschäftslogik (Backend/Sandbox) gewährleistet.

### Design Patterns
*   **Adapter Pattern**: Die Klasse `GitLabServiceAdapter` (`src/services/gitLabServiceAdapter.ts`) adaptiert die legacy `GitLabService`-Implementierung an das einheitliche `BaseGitService`-Interface. Dies ermöglicht den austauschbaren Einsatz verschiedener Git-Provider.
*   **Factory Pattern**: Die `GitServiceFactory` (`src/services/gitServiceFactory.ts`) abstrahiert die Instanziierung des korrekten Git-Services basierend auf den Benutzereinstellungen.
*   **Singleton Pattern**: Core-Services wie `GitServiceFactory` nutzen statische Instanzen, um Ressourcen zu schonen und den State über den Plugin-Lebenszyklus hinweg zu erhalten.

### Core vs. UI Separation
Die Anwendung ist in zwei Hauptkontexte getrennt, die asynchron über das `postMessage`-Protokoll kommunizieren:
*   **Core (Sandbox)**: Der "Backend"-Teil, der Zugriff auf die Figma-API hat. Einstiegspunkt ist `src/core/plugin.ts`. Hier läuft die Geschäftslogik (Export, Import, Analyse), organisiert in Services unter `src/services/`.
*   **UI (Frontend)**: Das HTML/JS-Frontend, das im Iframe läuft (`src/ui/main.js`, `ui.html`). Es ist verantwortlich für der Darstellung der Daten und User-Input, enthält aber keine Geschäftslogik für die Design-Manipulation.

### Ordnerstruktur (Core Source Tree)
Das `src`-Verzeichnis ist modular nach Verantwortlichkeiten gegliedert:

```text
src/
├── core/
│   └── plugin.ts           # Einstiegspunkt & Message-Handler (Controller)
├── services/               # Geschäftslogik (Single Responsibility Prinzip)
│   ├── variableImportService.ts  # Import & Parsing Logik
│   ├── tokenCoverageService.ts   # Design System Konsistenz-Analyse
│   ├── componentService.ts       # Komponenten-Management
│   ├── gitLabServiceAdapter.ts   # Git Integration
│   └── ...
├── types/                  # TypeScript Interfaces & Typ-Definitionen
├── ui/                     # Frontend Code (Vanilla JS + HTML)
└── utils/                  # Hilfsfunktionen (z.B. Color-Parsing, Error-Handling)
```

## 2. Feature-Analyse "Import & Design System"

Der Fokus liegt auf dem bidirektionalen Sync und der Qualitätssicherung des Design Systems.

### Import-Verantwortlichkeit
Die zentrale Klasse für den Import ist der `VariableImportService` (`src/services/variableImportService.ts`). Er übernimmt:
1.  **Parsing**: Umwandlung von externem Code (CSS, SCSS, Tailwind Config) in ein abstraktes `ImportToken`-Format.
2.  **Matching**: Abgleich der geparsten Tokens mit existierenden Figma-Variablen.
3.  **Execution**: Erstellung und Update der Variablen via Figma API.

### Matching-Logik (Code <-> Figma)
Der Abgleich erfolgt in der Methode `compareTokens`. Das System nutzt eine **nomalisierte Namenskonvention**, um Unterschiede zwischen Code-Syntax und Figma-Namensgebung zu überbrücken:
*   **Normalisierung**: CSS-Variablen wie `--color-primary-500` werden in Slash-Notation `color/primary/500` umgewandelt (und umgekehrt), um Figmas Gruppierungslogik zu entsprechen.
*   **Fuzzy Matching**: Falls kein direkter Treffer gefunden wird, versucht das System, Präfixe (`--`, `$`) zu entfernen und Trennzeichen zu harmonisieren (z.B. `.` zu `-`), um matches zu finden.
*   **Value Resolution**: Alias-Werte (z.B. `var(--brand)`) werden rekursiv aufgelöst, um den tatsächlichen Rohwert für den Vergleich heranzuziehen.

### Verbesserung des Design Systems (Quality Logic)
Zur Verbesserung der Konsistenz wurde der `TokenCoverageService` implementiert. Er führt "Hygiene Checks" durch:
*   **Scan-Algorithmus**: Durchläuft rekursiv alle Knoten einer Page.
*   **Hardcoded Value Detection**: Identifiziert Werte (Fills, Strokes, Typography), die *nicht* an Variablen gebunden sind (sog. "Detached Values").
*   **Tailwind Readiness**: Validiert Variablennamen gegen Tailwind-Konventionen (via `TailwindV4Service`), um sicherzustellen, dass das Design System code-kompatibel bleibt.

## 3. Key-Interfaces

Die Datenabstraktion erfolgt über TypeScript-Interfaces, die die Figma-interne Komplexität kapseln:

```typescript
// Abstraktion eines Tokens unabhängig von der Quelle (CSS, SCSS, JSON)
export interface ImportToken {
  name: string;
  value: string;
  type: 'color' | 'number' | 'string' | 'unknown';
  originalLine: string;
  isGradient?: boolean;
}

// Ergebnis des Matching-Prozesses (Diff)
export interface DiffResult {
  added: ImportToken[];
  modified: { token: ImportToken; oldValue: any; existingId: string }[];
  unchanged: ImportToken[];
  conflicts: { token: ImportToken; existingValue: any }[];
}

// Bericht über die Design-System-Abdeckung
export interface TokenCoverageResult {
  totalNodes: number;
  qualityScore: number;     // Gewichteter Score (0-100)
  issuesByCategory: {       // Probleme gruppiert nach Typ
    Layout: TokenCoverageIssue[];
    Fill: TokenCoverageIssue[];
    // ...
  };
  tailwindValidation: {     // Code-Kompatibilitäts-Metriken
    valid: Array<{ id: string; name: string }>;
    invalid: Array<{ id: string; name: string }>;
    readinessScore: number;
  };
}
```

## 4. Komplexität

Die drei komplexesten Algorithmen im System sind:

**1. `TokenCoverageService.analyzeNodes` (Analyse-Engine)**
*   **Funktion**: Orchestriert die vollständige Qualitätsanalyse einer Page.
*   **Komplexität**: Iteriert über Tausende von Nodes, trackt dabei parallel die Nutzung von Variablen und Komponenten in `Set`-basierten Maps (`variableUsage`), erkennt Auto-Layout-Muster und berechnet on-the-fly mehrere gewichtete Scores (Token Coverage, Layout Hygiene, Tailwind Readiness). Die Herausforderung liegt in der Performance-Optimierung (Vermeidung von Event-Loop-Blockaden bei großen Files).

**2. `VariableImportService.parseJSObjectBlock` (Rekursiver Parser)**
*   **Funktion**: Extrahiert Tokens aus verschachtelten JavaScript/JSON-Objekten (z.B. Tailwind Themes), ohne `eval()` nutzen zu können (Sicherheit).
*   **Komplexität**: Implementiert einen manuellen Lexer/Parser, der Klammer-Ebenen `{}` und String-Literale (z.B. innerhalb von `rgba()`) korrekt balancieren muss, um verschachtelte Strukturen rekursiv in flache Token-Pfade (z.B. `colors/primary/500`) aufzulösen.

**3. `VariableImportService.importVariables` (Sync-Logic)**
*   **Funktion**: Führt den eigentlichen Schreibvorgang in Figma durch.
*   **Komplexität**: Muss eine Vielzahl von Edge-Cases behandeln:
    *   Auflösung von CSS-Alias-Ketten (`var(--a)` -> `var(--b)` -> Value).
    *   Fehlerbehandlung bei Typ-Inkompatibilität (z.B. Versuch, eine Farbe in eine Number-Variable zu schreiben).
    *   Strategie-Handling (`merge` vs. `overwrite`).
    *   Implizite Erstellung von Modes und Collections, falls diese nicht existieren.
