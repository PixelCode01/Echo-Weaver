from flask import Flask, render_template, send_from_directory, redirect, jsonify, request
import os
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    return redirect('/')

@app.route('/play')
def play_direct():
    return render_template('play.html')

@app.route('/assets/<path:filename>')
def assets(filename):
    try:
        return send_from_directory('assets', filename)
    except Exception as e:
        logger.error(f"Error serving asset {filename}: {e}")
        return "", 404

@app.route('/static/<path:filename>')
def static_files(filename):
    try:
        return send_from_directory('static', filename)
    except Exception as e:
        logger.error(f"Error serving static file {filename}: {e}")
        return "", 404

@app.route('/api/highscore', methods=['GET'])
def get_highscore():
    try:
        with open('highscore.txt', 'r') as f:
            score = int(f.read().strip())
        return jsonify({'highscore': score})
    except:
        return jsonify({'highscore': 0})

@app.route('/api/highscore', methods=['POST'])
def update_highscore():
    try:
        data = request.get_json()
        new_score = int(data.get('score', 0))
        
        try:
            with open('highscore.txt', 'r') as f:
                current_score = int(f.read().strip())
        except:
            current_score = 0
            
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
    return jsonify({'status': 'healthy'})

@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html'), 200

if __name__ == '__main__':
    app.run(debug=True) 