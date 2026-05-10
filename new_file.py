# Import date and time
from datetime import datetime, timedelta

# Capture date and time
now = datetime.now()
print("Current date and time:", now)

# Create a specific date
my_birthday = datetime(2021, 12, 25)
print("My birthday:", my_birthday.date())

# Calculate days until birthday
future_date = now + timedelta(days=30)
print("Date after 30 days:", future_date.date())

# MATH LIBRARY
import math

num = 16
print("Square root of 16:", math.sqrt(num))
print("Ceiling of 3.7:", math.ceil(3.7))
print("Floor of 3.7:", math.floor(3.7))
print("Factorial of 5:", math.factorial(5))
print("Pi value:", math.pi)

# MATPLOTLIB LIBRARY
import matplotlib.pyplot as plt

# LeapLab Compatible - No input() needed
# Change these values directly in the code:
print("\n=== Line Graph ===")
print("Edit the x and y values in the code to change the graph")
print()

# CHANGE THESE VALUES:
x = [1, 2, 3, 4, 5]  # <-- Edit these numbers
y = [10, 20, 30, 40, 50]  # <-- Edit these numbers

print(f"X values: {x}")
print(f"Y values: {y}")
print()

# Create the plot
plt.plot(x, y, marker='o', color='red')
plt.title("Line Graph Example")
plt.xlabel("X-axis")
plt.ylabel("Y-axis")
plt.grid(True)
plt.show()

print("Graph displayed!")
print()
print("=" * 50)
print("To change values, edit lines 30-31 in the code:")
print("  x = [1, 2, 3, 4, 5]")
print("  y = [10, 20, 30, 40, 50]")
print("=" * 50)
