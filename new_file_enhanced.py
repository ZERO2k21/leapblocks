#!/usr/bin/env python3
"""
Enhanced Python Script with User Input for Matplotlib
Fixes:
1. Correct matplotlib import
2. User input for integer values from terminal
3. Error handling for invalid inputs
"""

# Import date and time
from datetime import datetime, timedelta

print("=" * 60)
print("PYTHON LIBRARIES DEMONSTRATION")
print("=" * 60)

# ============================================
# SECTION 1: DATE AND TIME
# ============================================
print("\n[1] DATE AND TIME OPERATIONS")
print("-" * 60)

# Capture current date and time
now = datetime.now()
print(f"Current date and time: {now}")

# Create a specific date
my_birthday = datetime(2021, 12, 25)
print(f"My birthday: {my_birthday.date()}")

# Calculate future date
future_date = now + timedelta(days=30)
print(f"Date after 30 days: {future_date.date()}")

# ============================================
# SECTION 2: MATH LIBRARY
# ============================================
print("\n[2] MATH LIBRARY OPERATIONS")
print("-" * 60)

import math

# Get number from user for math operations
while True:
    try:
        num = int(input("Enter a positive integer for math operations: "))
        if num > 0:
            break
        else:
            print("Please enter a positive number!")
    except ValueError:
        print("Invalid input! Please enter an integer.")

print(f"Square root of {num}: {math.sqrt(num)}")
print(f"Ceiling of 3.7: {math.ceil(3.7)}")
print(f"Floor of 3.7: {math.floor(3.7)}")

# Factorial (only for reasonable numbers)
if num <= 20:
    print(f"Factorial of {num}: {math.factorial(num)}")
else:
    print(f"Factorial of {num}: Too large to display")

print(f"Pi value: {math.pi}")

# ============================================
# SECTION 3: MATPLOTLIB LIBRARY
# ============================================
print("\n[3] MATPLOTLIB - LINE GRAPH")
print("-" * 60)

import matplotlib.pyplot as plt

def get_integer_list(prompt):
    """Get a list of integers from user input"""
    while True:
        try:
            user_input = input(prompt)
            # Split by comma and convert to integers
            values = [int(val.strip()) for val in user_input.split(',')]
            if len(values) > 0:
                return values
            else:
                print("Please enter at least one value!")
        except ValueError:
            print("Invalid input! Please enter integers separated by commas.")
            print("Example: 1, 2, 3, 4, 5")

# Get x values
print("\nEnter X-axis values (integers separated by commas)")
print("Example: 1, 2, 3, 4, 5")
x = get_integer_list("X values: ")

# Get y values
print("\nEnter Y-axis values (integers separated by commas)")
print(f"Note: You entered {len(x)} x-values, so enter {len(x)} y-values")
print("Example: 10, 20, 30, 40, 50")

while True:
    y = get_integer_list("Y values: ")
    if len(y) == len(x):
        break
    else:
        print(f"Error: You entered {len(y)} values, but need {len(x)} values to match x-axis!")
        print("Please try again.")

# Display the data
print("\n" + "=" * 60)
print("GRAPH DATA:")
print("-" * 60)
print(f"X values: {x}")
print(f"Y values: {y}")
print("=" * 60)

# Create the plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, marker='o', color='red', linewidth=2, markersize=8)
plt.title("Line Graph Example", fontsize=16, fontweight='bold')
plt.xlabel("X-axis", fontsize=12)
plt.ylabel("Y-axis", fontsize=12)
plt.grid(True, alpha=0.3)
plt.tight_layout()

print("\nDisplaying graph... (Close the graph window to exit)")
plt.show()

print("\n" + "=" * 60)
print("PROGRAM COMPLETED SUCCESSFULLY!")
print("=" * 60)
