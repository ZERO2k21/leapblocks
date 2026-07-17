# LeapLab Compatible Version - Simple Sum Calculator
# This version works in browser-based Python environments

print("=== Simple Sum Calculator ===")
print("This will calculate the sum of numbers from 1 to n")
print()

# For LeapLab, we'll use a predefined value since input() has issues
# You can change this value directly in the code
n = 10  # Change this number to test different values

print(f"Calculating sum from 1 to {n}...")
print()

total = 0
for i in range(1, n + 1):
    total += i
    print(f"Step {i}: total = {total}")

print()
print(f"Final Sum = {total}")
print()
print("=" * 40)
print(f"Formula check: n*(n+1)/2 = {n*(n+1)//2}")
print("=" * 40)
