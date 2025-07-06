# Echo Weaver

A web-based sound wave game where you defend your core against enemies using sound waves.

## Game Features

- Create sound waves by clicking and dragging
- Three different wave modes: Normal, Focused, and Wide
- Echo Burst special ability
- Power-ups that enhance your abilities
- Increasing difficulty with each wave
- High score tracking

## Deployment Instructions for PythonAnywhere

### Quick Deployment Using the Package

For a quick deployment, you can use the pre-packaged deployment file:

1. Download the `echo_weaver_pythonanywhere.zip` file from this repository
2. Upload it to your PythonAnywhere account
3. Extract the ZIP file: `unzip echo_weaver_pythonanywhere.zip -d echo_weaver`
4. Set up a virtual environment:
   ```bash
   cd echo_weaver
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
5. Configure a new web app in the PythonAnywhere Web tab
6. Set the WSGI configuration file to point to `wsgi.py`
7. Add static file mapping: `/static/` -> `/home/yourusername/echo_weaver/static/`
8. Reload the web app

### Manual Deployment

### Prerequisites

- A PythonAnywhere account
- Git installed on PythonAnywhere
- Your repository hosted on GitHub

### Deployment Steps

1. **Log in to PythonAnywhere**

2. **Open a Bash console**

3. **Clone the repository**
   ```bash
   git clone https://github.com/Pixel01/Echo-Weaver.git
   ```

4. **Set up a virtual environment**
   ```bash
   cd Echo-Weaver
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Configure the web app**
   - Go to the Web tab in PythonAnywhere
   - Click "Add a new web app"
   - Choose your domain name
   - Select "Manual configuration"
   - Choose Python version (3.8 or newer)

6. **Configure the WSGI file**
   - In the Web tab, find the link to the WSGI configuration file
   - Replace the content with:
   ```python
   import sys
   import os
   
   path = '/home/Pixel01/Echo-Weaver'
   if path not in sys.path:
       sys.path.append(path)
   
   from app import app as application
   ```

7. **Set up static file mappings**
   - In the Web tab, under "Static Files"
   - Add the following mappings:
     - URL: `/static/` -> Directory: `/home/Pixel01/Echo-Weaver/static/`

8. **Start the web app**
   - Click the "Reload" button in the Web tab

### Updating the App

To update the app with new changes:

1. **Open a Bash console**
2. **Navigate to your project directory**
   ```bash
   cd Echo-Weaver
   ```
3. **Pull the latest changes**
   ```bash
   git pull origin main
   ```
4. **Reload the web app**
   - Go to the Web tab and click "Reload"

## Development

### Local Setup

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run the development server: `python run.py`

### Game Controls

**Desktop:**
- Click and drag to create sound waves
- Press 1, 2, 3 to switch between wave modes
- Press Space for Echo Burst

**Mobile:**
- Touch and drag to create sound waves
- Tap the numbered buttons to switch wave modes
- Double tap the core for Echo Burst

## License

All rights reserved.

## Description

Echo Weaver is an engaging arcade game where you protect a central core from waves of enemies by drawing sound waves. The game features:

- Dynamic wave-drawing combat system
- Multiple enemy types with unique behaviors
- Power-ups with special abilities
- Combo and fever mechanics for high scores
- Beautiful visual effects and animations

## How to Play

1. Click and drag to create sound waves that destroy enemies
2. Press 1, 2, 3 to switch between wave modes (Normal, Focused, Wide)
3. Press SPACE for Echo Burst (clears nearby enemies, has cooldown)
4. Collect power-ups for temporary boosts
5. Survive as long as possible and achieve the highest score!

## Enemy Types

- **Basic Enemy**: Standard enemy that moves directly toward the core
- **Zigzag Enemy**: Moves in a zigzag pattern, making it harder to hit
- **Ghost Enemy**: Requires multiple hits to destroy
- **Charger Enemy**: Charges at high speed when close to the core
- **Splitter Enemy**: Splits into smaller enemies when hit
- **Shielded Enemy**: Protected by a shield that must be broken first

## Power-ups

- **Invincibility**: Makes your core temporarily invulnerable
- **Wave Boost**: Enhances your wave power
- **Slow Time**: Slows down enemy movement
- **Clear Screen**: Destroys all enemies on screen
- **Wave Width**: Creates wider waves
- **Time Stop**: Freezes all enemies temporarily
- **Wave Magnet**: Pulls enemies toward your waves

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Canvas API)
- **Backend**: Flask (Python)
- **Deployment**: PythonAnywhere

## Acknowledgments

- Original Pygame version converted to web-based implementation
- Inspired by arcade wave-based shooters
