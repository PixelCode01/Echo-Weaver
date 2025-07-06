from flask import Flask, render_template, send_from_directory, redirect, jsonify, request
import os
import logging

app = Flask(__name__)

# Set up basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/')
def index():
    """Serve the main landing page"""
    return render_template('index.html')

@app.route('/game')
def game():
    """Redirect to the main game page"""
    return redirect('/')

@app.route('/play')
def play_direct():
    """Serve the simple HTML5 game version"""
    return render_template('play.html')

@app.route('/assets/<path:filename>')
def assets(filename):
    """Serve game assets (sounds, sprites)"""
    try:
        return send_from_directory('assets', filename)
    except Exception as e:
        logger.error(f"Error serving asset {filename}: {e}")
        return "", 404

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    try:
        return send_from_directory('static', filename)
    except Exception as e:
        logger.error(f"Error serving static file {filename}: {e}")
        return "", 404

@app.route('/api/highscore', methods=['GET'])
def get_highscore():
    """API endpoint to get high score"""
    try:
        with open('highscore.txt', 'r') as f:
            score = int(f.read().strip())
        return jsonify({'highscore': score})
    except:
        return jsonify({'highscore': 0})

@app.route('/api/highscore', methods=['POST'])
def update_highscore():
    """API endpoint to update high score"""
    try:
        data = request.get_json()
        new_score = int(data.get('score', 0))
        
        # Read current high score
        try:
            with open('highscore.txt', 'r') as f:
                current_score = int(f.read().strip())
        except:
            current_score = 0
            
        # Update if new score is higher
        if new_score > current_score:
            with open('highscore.txt', 'w') as f:
                f.write(str(new_score))
            return jsonify({'success': True, 'highscore': new_score})
        else:
            return jsonify({'success': False, 'message': 'Score not high enough'})
    except Exception as e:
        logger.error(f"Error updating high score: {e}")
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

@app.errorhandler(404)
def page_not_found(e):
    """Custom 404 error page"""
    return render_template('index.html'), 200

if __name__ == '__main__':
    app.run(debug=True) 