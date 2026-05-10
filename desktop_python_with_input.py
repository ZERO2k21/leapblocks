#!/usr/bin/env python3
"""
Desktop Python Version - WITH USER INPUT
Run this file with regular Python (not LeapLab) to use input()

HOW TO RUN:
1. Open Windows Terminal or Command Prompt
2. Navigate to this folder:
   cd C:\Users\ruthr\OneDrive\Desktop\leapblocks
3. Run this file:
   python desktop_python_with_input.py
"""

from datetime import datetime, timedelta
import math
import matplotlib.pyplot as plt

print("=" * 70)
print("PYTHON DEMO - WITH USER INPUT")
print("=" * 70)
print()
print("NOTE: This file must be run with regular Python, not LeapLab!")
print("      LeapLab uses browser-based Python which doesn't support input()")
print()

# ============================================
# SECTION 1: DATE AND TIME
# ============================================
print("[1] DATE AND TIME")
print("-" * 70)

now = datetime.now()
print(f"Current date and time: {now}")

my_birthday = datetime(2021, 12, 25)
print(f"My birthday: {my_birthday.date()}")

future_date = now + timedelta(days=30)
print(f"Date after 30 days: {future_date.date()}")

# ============================================
# SECTION 2: MATH LIBRARY WITH USER INPUT
# ============================================
print()
print("[2] MATH LIBRARY - WITH USER INPUT")
print("-" * 70)

while True:
    try:
        num = int(input("Enter a positive integer for math operations: "))
        if num > 0:
            break
        else:
            print("Please enter a positive number!")
    except ValueError:
        print("Invalid input! Please enter an integer.")

print(f"\nMath operations on {num}:")
print(f"  Square root: {math.sqrt(num)}")
print(f"  Ceiling of 3.7: {math.ceil(3.7)}")
print(f"  Floor of 3.7: {math.floor(3.7)}")

if num <= 20:
    print(f"  Factorial: {math.factorial(num)}")
else:
    print(f"  Factorial: Too large to display")

print(f"  Pi value: {math.pi}")

# ============================================
# SECTION 3: MATPLOTLIB WITH USER INPUT
# ============================================
print()
print("[3] MATPLOTLIB - WITH USER INPUT")
print("-" * 70)

def get_integer_list(prompt):
    """Get a list of integers from user input"""
    while True:
        try:
            user_input = input(prompt)
            values = [int(val.strip()) for val in user_input.split(',')]
            if len(values) > 0:
                return values
            else:
                print("Please enter at least one value!")
        except ValueError:
            print("Invalid input! Please enter integers separated by commas.")
            print("Example: 1, 2, 3, 4, 5")

print("\nEnter X-axis values (integers separated by commas)")
print("Example: 1, 2, 3, 4, 5")
x = get_integer_list("X values: ")

print("\nEnter Y-axis values (integers separated by commas)")
print(f"Note: You entered {len(x)} x-values, so enter {len(x)} y-values")
print("Example: 10, 20, 30, 40, 50")

while True:
    y = get_integer_list("Y values: ")
    if len(y) == len(x):
        break
    else:
        print(f"Error: You entered {len(y)} values, but need {len(x)} values!")
        print("Please try again.")

# Display the data
print()
print("=" * 70)
print("GRAPH DATA:")
print(f"  X values: {x}")
print(f"  Y values: {y}")
print("=" * 70)

# Create the plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, marker='o', color='red', linewidth=2, markersize=8)
plt.title("Line Graph - User Input Data", fontsize=16, fontweight='bold')
plt.xlabel("X-axis", fontsize=12)
plt.ylabel("Y-axis", fontsize=12)
plt.grid(True, alpha=0.3)
plt.tight_layout()

print("\nDisplaying graph... (Close the graph window to exit)")
plt.show()

print()
print("=" * 70)
print("PROGRAM COMPLETED!")
print("=" * 70)
