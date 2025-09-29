from flask import Flask, render_template, render_template_string, send_from_directory, jsonify, request, session
import os
import logging
import json
import sys

app = Flask(__name__)
app.secret_key = os.urandom(24)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
os.makedirs('highscores', exist_ok=True)
HIGHSCORE_FILE = os.path.join('highscores', 'highscores.json')
if not os.path.exists(HIGHSCORE_FILE):
    with open(HIGHSCORE_FILE, 'w') as f:
        json.dump([], f)

@app.route('/')
def index():
    logger.info("Serving index page")
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error rendering index.html: {e}")
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Echo Weaver</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #000; color: #fff; }
                .container { max-width: 600px; margin: 0 auto; }
                h1 { color: #00ff00; }
                .error { color: #ff0000; background: #300; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .info { color: #00ffff; background: #003; padding: 20px; border-radius: 10px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>ECHO WEAVER</h1>
                <div class="error">
                    <h2>Template Error</h2>
                    <p>Error: ''' + str(e) + '''</p>
                    <p>This is a fallback page. The template system is not working properly.</p>
                </div>
                <div class="info">
                    <h3>Debug Information</h3>
                    <p>Current working directory: ''' + os.getcwd() + '''</p>
                    <p>Templates directory exists: ''' + str(os.path.exists('templates')) + '''</p>
                    <p>Index.html exists: ''' + str(os.path.exists('templates/index.html')) + '''</p>
                </div>
                <p><a href="/diagnose" style="color: #00ff00;">Click here for detailed diagnostics</a></p>
            </div>
        </body>
        </html>
        ''', 200

@app.route('/game')
def game():
    logger.info("Serving game page via /game route")
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error rendering game page: {e}")
        return index()

@app.route('/guide')
def guide():
    logger.info("Serving game guide page")
    try:
        return render_template('guide.html')
    except Exception as e:
        logger.error(f"Error rendering guide page: {e}")
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Echo Weaver - Game Guide</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #000; color: #fff; }
                .container { max-width: 600px; margin: 0 auto; }
                h1 { color: #00ff00; }
                .error { color: #ff0000; background: #300; padding: 20px; border-radius: 10px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>ECHO WEAVER - GAME GUIDE</h1>
                <div class="error">
                    <h2>Guide Template Error</h2>
                    <p>Error: ''' + str(e) + '''</p>
                    <p>The guide template is not loading properly.</p>
                </div>
                <p><a href="/" style="color: #00ff00;">← Back to Game</a></p>
            </div>
        </body>
        </html>
        ''', 200

@app.route('/play')
def play_direct():
    logger.info("Serving WebAssembly game via /play route")
    try:
        full_path = os.path.join(os.getcwd(), 'static', 'pygbag', 'index.html')
        logger.info(f"Looking for file at: {full_path}")
        logger.info(f"File exists: {os.path.exists(full_path)}")
        
        response = send_from_directory('static/pygbag', 'index.html')
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        logger.info(f"Response headers: {dict(response.headers)}")
        return response
    except Exception as e:
        logger.error(f"Error serving WebAssembly game: {e}")
        raise

@app.route('/assets/<path:filename>')
def assets(filename):
    response = send_from_directory('assets', filename)
    response.headers['Cache-Control'] = 'public, max-age=86400'
    return response

@app.route('/static/<path:filename>')
def static_files(filename):
    logger.info(f"Serving static file: {filename}")
    
    try:
        full_path = os.path.join(os.getcwd(), 'static', filename)
        logger.info(f"Looking for static file at: {full_path}")
        logger.info(f"File exists: {os.path.exists(full_path)}")
        
        response = send_from_directory('static', filename)
        
        response.headers['Cache-Control'] = 'public, max-age=86400'
            
        return response
    except Exception as e:
        logger.error(f"Error serving static file {filename}: {e}")
        raise

@app.route('/api/highscores', methods=['GET'])
def get_highscores():
    try:
        if not os.path.exists(HIGHSCORE_FILE) or os.path.getsize(HIGHSCORE_FILE) == 0:
            with open(HIGHSCORE_FILE, 'w') as f:
                json.dump([], f)
            return jsonify([])
            
        with open(HIGHSCORE_FILE, 'r') as f:
            content = f.read().strip()
            if not content:
                return jsonify([])
                
            highscores = json.loads(content)
            if not isinstance(highscores, list):
                logger.error(f"Highscores file contains invalid data: {highscores}")
                return jsonify([])
        
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
        
        deduped_highscores = list(name_to_entry.values())
        
        deduped_highscores.sort(key=lambda x: x['score'], reverse=True)
        
        deduped_highscores = deduped_highscores[:10]
        
        with open(HIGHSCORE_FILE, 'w') as f:
            json.dump(deduped_highscores, f)
                
        return jsonify(deduped_highscores)
    except Exception as e:
        logger.error(f"Error getting highscores: {e}")
        return jsonify([])

@app.route('/api/player', methods=['GET'])
def get_player():
    player_name = session.get('player_name', '')
    return jsonify({"name": player_name})

@app.route('/api/player', methods=['POST'])
def save_player():
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
        
        player_exists = False
        player_index = -1
        
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
        
        if player_exists:
            if score > highscores[player_index].get('score', 0):
                highscores[player_index]['score'] = score
        else:
            highscores.append({"name": name, "score": score})
        
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
    return jsonify({'status': 'healthy'})

@app.route('/test-universal-controls')
def test_universal_controls():
    logger.info("Testing universal_controls.js accessibility")
    try:
        full_path = os.path.join(os.getcwd(), 'static', 'js', 'universal_controls.js')
        logger.info(f"Looking for universal_controls.js at: {full_path}")
        logger.info(f"File exists: {os.path.exists(full_path)}")
        
        if os.path.exists(full_path):
            with open(full_path, 'r') as f:
                content = f.read(100)
            return jsonify({
                'file_exists': True,
                'file_size': os.path.getsize(full_path),
                'content_preview': content,
                'path': full_path
            })
        else:
            return jsonify({
                'file_exists': False,
                'error': 'File not found',
                'path': full_path
            })
    except Exception as e:
        logger.error(f"Error testing universal_controls.js: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/diagnose')
def diagnose():
    logger.info("Running diagnostics")
    
    diagnostic_info = {
        'current_working_directory': os.getcwd(),
        'python_version': sys.version,
        'flask_version': Flask.__version__,
        'app_root_path': app.root_path,
        'app_instance_path': app.instance_path,
        'app_template_folder': app.template_folder,
        'app_static_folder': app.static_folder,
        'templates_dir_exists': os.path.exists('templates'),
        'static_dir_exists': os.path.exists('static'),
        'index_template_exists': os.path.exists('templates/index.html'),
        'play_template_exists': os.path.exists('templates/play.html'),
        'app_py_exists': os.path.exists('app.py'),
        'wsgi_py_exists': os.path.exists('wsgi.py'),
        'requirements_exists': os.path.exists('requirements.txt'),
        'highscore_file_exists': os.path.exists(HIGHSCORE_FILE),
        'highscore_file_size': os.path.getsize(HIGHSCORE_FILE) if os.path.exists(HIGHSCORE_FILE) else 0,
        'directory_contents': {
            'root': os.listdir('.') if os.path.exists('.') else [],
            'templates': os.listdir('templates') if os.path.exists('templates') else [],
            'static': os.listdir('static') if os.path.exists('static') else []
        }
    }
    
    try:
        test_template = render_template_string('<h1>Template Test</h1>')
        diagnostic_info['template_system_working'] = True
    except Exception as e:
        diagnostic_info['template_system_working'] = False
        diagnostic_info['template_error'] = str(e)
    
    return jsonify(diagnostic_info)

@app.route('/wasm-test')
def wasm_test():
    logger.info("Serving WebAssembly test page")
    response = send_from_directory('static', 'wasm_test.html')
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    logger.info(f"Response headers for wasm-test: {dict(response.headers)}")
    return response

@app.errorhandler(404)
def page_not_found(e):
    logger.info(f"404 error for path: {request.path}")
    try:
        return render_template('index.html'), 200
    except Exception as template_error:
        logger.error(f"Error rendering template in 404 handler: {template_error}")
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Echo Weaver - Page Not Found</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #000; color: #fff; }
                .container { max-width: 600px; margin: 0 auto; }
                h1 { color: #00ff00; }
                .error { color: #ff0000; background: #300; padding: 20px; border-radius: 10px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>ECHO WEAVER</h1>
                <div class="error">
                    <h2>Page Not Found</h2>
                    <p>The requested page was not found: ''' + request.path + '''</p>
                    <p>Template error: ''' + str(template_error) + '''</p>
                </div>
                <p><a href="/" style="color: #00ff00;">Go to Home Page</a></p>
                <p><a href="/diagnose" style="color: #00ffff;">View Diagnostics</a></p>
            </div>
        </body>
        </html>
        ''', 200

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Server error occurred', 'message': str(e)}), 500

@app.before_request
def log_request():
    app.logger.debug(f"Request: {request.path} from {request.remote_addr}")

@app.after_request
def add_cors_headers(response):
    if '/pygbag/' in request.path or '/play' in request.path or '/wasm-test' in request.path:
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/static/pygbag/<path:filename>')
def pygbag_files(filename):
    logger.info(f"Serving pygbag file: {filename}")
    try:
        full_path = os.path.join(os.getcwd(), 'static', 'pygbag', filename)
        logger.info(f"Looking for pygbag file at: {full_path}")
        logger.info(f"File exists: {os.path.exists(full_path)}")
        
        response = send_from_directory('static/pygbag', filename)
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
    app.run(debug=True, host='0.0.0.0', port=5000)
