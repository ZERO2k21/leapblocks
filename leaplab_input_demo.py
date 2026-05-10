# LeapLab Input Demo
# Demonstrates different ways to handle input in browser-based Python

print("=" * 60)
print("LEAPLAB INPUT DEMONSTRATION")
print("=" * 60)
print()

# Method 1: Direct value assignment (RECOMMENDED for LeapLab)
print("[Method 1] Direct Value Assignment")
print("-" * 60)
n = 5  # Change this value directly
print(f"n = {n}")
print(f"Sum from 1 to {n} = {sum(range(1, n+1))}")
print()

# Method 2: Using lists for multiple values
print("[Method 2] Using Lists")
print("-" * 60)
numbers = [1, 2, 3, 4, 5]  # Change these values
print(f"Numbers: {numbers}")
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers)/len(numbers)}")
print()

# Method 3: Using dictionary for named values
print("[Method 3] Using Dictionary")
print("-" * 60)
data = {
    'x': [1, 2, 3, 4, 5],
    'y': [10, 20, 30, 40, 50]
}
print(f"X values: {data['x']}")
print(f"Y values: {data['y']}")
print()

# Method 4: Try input() with error handling
print("[Method 4] Testing input() function")
print("-" * 60)
try:
    # This might not work in LeapLab
    user_input = input("Enter a number: ")
    print(f"You entered: {user_input}")
except Exception as e:
    print(f"Input not supported: {type(e).__name__}")
    print("Use Method 1, 2, or 3 instead!")
print()

print("=" * 60)
print("RECOMMENDATION FOR LEAPLAB:")
print("=" * 60)
print("Use Method 1 (Direct Assignment) - Change values in code")
print("Example:")
print("  n = 10  # Change this number")
print("  x = [1, 2, 3, 4, 5]  # Change these values")
print("=" * 60)
