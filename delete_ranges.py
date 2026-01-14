
import sys

file_path = 'src/ui/main.js'

ranges = [
    (9140, 9180),
    (6732, 6787),
    (4661, 4902),
    (3571, 3717),
    (2845, 2903),
    (1800, 2658),
    (951, 988)
]

# Sort generic ranges descending
ranges.sort(key=lambda x: x[0], reverse=True)

try:
    with open(file_path, 'r') as f:
        lines = f.readlines()

    for start, end in ranges:
        # Convert to 0-indexed. 
        # start is 1-based, inclusive. 
        # end is 1-based, inclusive.
        # So lines[start-1 : end] is what corresponds to 1-based range.
        # Python slice [a:b] excludes b. So strictly [start-1:end].
        
        idx_start = start - 1
        idx_end = end
        
        # Validation
        print(f"Deleting {start}-{end} ({len(lines[idx_start:idx_end])} lines)")
        print(f"  Start: {lines[idx_start].strip()[:50]}")
        print(f"  End:   {lines[idx_end-1].strip()[:50]}")
        
        del lines[idx_start:idx_end]

    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Successfully deleted ranges.")

except Exception as e:
    print(f"Error: {e}")
