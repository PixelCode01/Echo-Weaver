from flask import Flask, render_template, send_from_directory, jsonify, request, session
import os
import logging
import json

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for sessions

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Ensure the highscores directory exists
os.makedirs('highscores', exist_ok=True)
HIGHSCORE_FILE = os.path.join('highscores', 'highscores.json')

# Initialize highscores file if it doesn't exist
if not os.path.exists(HIGHSCORE_FILE):
    with open(HIGHSCORE_FILE, 'w') as f:
        json.dump([], f)

@app.route('/')
def index():
    """Serve the main game page"""
    logger.info("Serving index page")
    return render_template('index.html')

@app.route('/game')
def game():
    """Alternative route for the game"""
    logger.info("Serving game page via /game route")
    return render_template('index.html')

@app.route('/play')
def play_direct():
    """Direct route to the WebAssembly game"""
    logger.info("Serving WebAssembly game via /play route")
    try:
        # Check if the file exists
        full_path = os.path.join(os.getcwd(), 'static', 'pygbag', 'index.html')
        logger.info(f"Looking for file at: {full_path}")
        logger.info(f"File exists: {os.path.exists(full_path)}")
        
        response = send_from_directory('static/pygbag', 'index.html')
        # Add required CORS headers for WebAssembly
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        logger.info(f"Response headers: {dict(response.headers)}")
        return response
    except Exception as e:
        logger.error(f"Error serving WebAssembly game: {e}")
        raise

@app.route('/assets/<path:filename>')
def assets(filename):
    """Serve game assets (sounds, sprites)"""
    response = send_from_directory('assets', filename)
    # Add Cache-Control header - cache assets for 1 day
    response.headers['Cache-Control'] = 'public, max-age=86400'
    return response

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    logger.info(f"Serving static file: {filename}")
    
    try:
        # Check if the file exists
        full_path = os.path.join(os.getcwd(), 'static', filename)
        logger.info(f"Looking for static file at: {full_path}")
        logger.info(f"File exists: {os.path.exists(full_path)}")
        
        response = send_from_directory('static', filename)
        
        # Cache other static files for 1 day
        response.headers['Cache-Control'] = 'public, max-age=86400'
            
        return response
    except Exception as e:
        logger.error(f"Error serving static file {filename}: {e}")
        raise

@app.route('/api/highscores', methods=['GET'])
def get_highscores():
    try:
        # Check if file exists and has content
        if not os.path.exists(HIGHSCORE_FILE) or os.path.getsize(HIGHSCORE_FILE) == 0:
            # Initialize with empty array if file doesn't exist or is empty
            with open(HIGHSCORE_FILE, 'w') as f:
                json.dump([], f)
            return jsonify([])
            
        with open(HIGHSCORE_FILE, 'r') as f:
            content = f.read().strip()
            if not content:
                # Return empty array if file is empty
                return jsonify([])
                
            highscores = json.loads(content)
            if not isinstance(highscores, list):
                # If not a list, return empty array
                logger.error(f"Highscores file contains invalid data: {highscores}")
                return jsonify([])
        
        # Deduplicate entries by name (keep highest score for each name)
        name_to_entry = {}
        for entry in highscores:
            if not isinstance(entry, dict):
                continue
                
            name = entry.get('name')
            score = entry.get('score')
            
            if not name or not isinstance(score, (int, float)):
                continue
                
            if name not in name_to_entry or score > name_to_entry[name]['score']:
                name_to_entry[name] = {'name': name, 'score': score}
        
        # Convert back to array format
        deduped_highscores = list(name_to_entry.values())
        
        # Sort by score (highest first)
        deduped_highscores.sort(key=lambda x: x['score'], reverse=True)
        
        # Keep only top 10
        deduped_highscores = deduped_highscores[:10]
        
        # Update the file with deduplicated data
        with open(HIGHSCORE_FILE, 'w') as f:
            json.dump(deduped_highscores, f)
                
        return jsonify(deduped_highscores)
    except Exception as e:
        logger.error(f"Error getting highscores: {e}")
        # Return empty array on error
        return jsonify([])

@app.route('/api/player', methods=['GET'])
def get_player():
    """Get the player's name from the session"""
    player_name = session.get('player_name', '')
    return jsonify({"name": player_name})

@app.route('/api/player', methods=['POST'])
def save_player():
    """Save the player's name to the session"""
    data = request.json
    name = data.get('name', 'Anonymous')
    session['player_name'] = name
    return jsonify({"success": True})

@app.route('/api/highscores', methods=['POST'])
def save_highscore():
    try:
        data = request.json
        name = data.get('name', session.get('player_name', 'Anonymous'))
        score = data.get('score', 0)
        
        # Ensure highscores file exists and contains valid JSON
        if not os.path.exists(HIGHSCORE_FILE) or os.path.getsize(HIGHSCORE_FILE) == 0:
            with open(HIGHSCORE_FILE, 'w') as f:
                json.dump([], f)
            highscores = []
        else:
            try:
                with open(HIGHSCORE_FILE, 'r') as f:
                    content = f.read().strip()
                    if not content:
                        highscores = []
                    else:
                        highscores = json.loads(content)
                        if not isinstance(highscores, list):
                            logger.error(f"Highscores file contains invalid data: {highscores}")
                            highscores = []
            except json.JSONDecodeError:
                logger.error("Invalid JSON in highscores file")
                highscores = []
        
        # Check if player already has a score
        player_exists = False
        player_index = -1
        
        # First, remove any duplicate entries for this player
        filtered_highscores = []
        for entry in highscores:
            if isinstance(entry, dict) and entry.get('name') == name:
                if not player_exists:
                    player_exists = True
                    player_index = len(filtered_highscores)
                    filtered_highscores.append(entry)
            else:
                filtered_highscores.append(entry)
        
        highscores = filtered_highscores
        
        # Update existing player's score if it's higher
        if player_exists:
            if score > highscores[player_index].get('score', 0):
                highscores[player_index]['score'] = score
        else:
            # Add new player
            highscores.append({"name": name, "score": score})
        
        # Sort and keep top 10
        def safe_get_score(item):
            if isinstance(item, dict):
                return item.get('score', 0)
            return 0
            
        highscores.sort(key=safe_get_score, reverse=True)
        highscores = highscores[:10]
        
        with open(HIGHSCORE_FILE, 'w') as f:
            json.dump(highscores, f)
            
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error saving highscore: {e}")
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

@app.route('/diagnose')
def diagnose():
    """Diagnostic route to check WebAssembly files"""
    logger.info("Running diagnostics")
    results = {}
    
    # Check if key files exist
    pygbag_dir = os.path.join(os.getcwd(), 'static', 'pygbag')
    results['pygbag_dir_exists'] = os.path.isdir(pygbag_dir)
    
    if results['pygbag_dir_exists']:
        results['files'] = {}
        key_files = ['index.html', 'echo_weaver.apk', 'favicon.png']
        for file in key_files:
            file_path = os.path.join(pygbag_dir, file)
            results['files'][file] = {
                'exists': os.path.exists(file_path),
                'size': os.path.getsize(file_path) if os.path.exists(file_path) else 0
            }
    
    # Check directory contents
    if results['pygbag_dir_exists']:
        results['directory_contents'] = os.listdir(pygbag_dir)
    
    return jsonify(results)

@app.route('/wasm-test')
def wasm_test():
    """Serve a simple WebAssembly test page"""
    logger.info("Serving WebAssembly test page")
    response = send_from_directory('static', 'wasm_test.html')
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    logger.info(f"Response headers for wasm-test: {dict(response.headers)}")
    return response

@app.errorhandler(404)
def page_not_found(e):
    """Custom 404 error page"""
    return render_template('index.html'), 200  # Return the game page instead of 404

@app.errorhandler(500)
def server_error(e):
    """Custom 500 error page"""
    return jsonify({'error': 'Server error occurred', 'message': str(e)}), 500

@app.before_request
def log_request():
    """Log incoming requests for debugging"""
    app.logger.debug(f"Request: {request.path} from {request.remote_addr}")

@app.after_request
def add_cors_headers(response):
    """Add CORS headers to all responses"""
    # Add CORS headers for WebAssembly content
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
    return response

@app.route('/static/pygbag/<path:filename>')
def pygbag_files(filename):
    """Serve pygbag files with special headers"""
    logger.info(f"Serving pygbag file: {filename}")
    try:
        full_path = os.path.join(os.getcwd(), 'static', 'pygbag', filename)
        logger.info(f"Looking for pygbag file at: {full_path}")
        logger.info(f"File exists: {os.path.exists(full_path)}")
        
        response = send_from_directory('static/pygbag', filename)
        # Add CORS headers for WebAssembly content
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        logger.info(f"Response headers for pygbag file: {dict(response.headers)}")
        return response
    except Exception as e:
        logger.error(f"Error serving pygbag file {filename}: {e}")
        raise

if __name__ == '__main__':
    # For local development
    app.run(debug=True, host='0.0.0.0', port=5000)
