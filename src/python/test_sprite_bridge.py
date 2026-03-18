# Test file for Sprite Bridge functionality
# This file demonstrates how intermediate blocks can call sprite panel functions

# Test 1: Basic sprite creation and movement
print("=== Test 1: Basic Sprite Operations ===")
sprite = Sprite('Robot')
sprite.say("Hello from Python!")
sprite.move(50)
sprite.turn_right()
print("Robot moved and turned")

# Test 2: Multiple sprites
print("\n=== Test 2: Multiple Sprites ===")
cat = Sprite('Cat')
cat.say("Meow!")
cat.move(30)
cat.turn_left()

ball = Sprite('Ball')
ball.go_to(100, 50)
ball.say("I'm a ball!")

# Test 3: Appearance changes
print("\n=== Test 3: Appearance Changes ===")
robot = Sprite('Robot')
robot.set_size(150)
robot.next_costume()
robot.say("I'm bigger now!")

# Test 4: Direction control
print("\n=== Test 4: Direction Control ===")
arrow = Sprite('Arrow')
arrow.point_in_direction(90)  # Face right
arrow.move(40)
arrow.point_in_direction(0)   # Face up
arrow.move(30)

# Test 5: Using sprite bridge functions directly
print("\n=== Test 5: Direct Bridge Functions ===")
# These would be called from intermediate blocks:
# window.spritePanelFunctions.move('Robot', 20)
# window.spritePanelFunctions.say('Robot', 'Hello from blocks!')
# window.spritePanelFunctions.nextCostume('Robot')

print("All tests completed!")
print("Check the terminal for sprite action logs.")