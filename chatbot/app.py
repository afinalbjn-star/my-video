# app.py
from flask import Flask, request, jsonify, session, render_template
import os
import requests

app = Flask(__name__, static_folder='static', template_folder='.')
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret')   # untuk session

# Konfigurasi OpenRouter
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', 'sk-or-v1-PLACEHOLDER')
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

@app.route('/')
def index():
    try:
        return render_template('index.html')
    except Exception as e:
        return f"Error loading index.html: {str(e)}", 500

@app.route('/test')
def test():
    return "Flask server is running correctly!"

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '').strip()
    
    if not user_message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    
    # Initialize conversation if not exists
    if 'conversation' not in session:
        session['conversation'] = []
    
    # Add user message to conversation
    session['conversation'].append({
        'role': 'user',
        'content': user_message
    })
    
    try:
        # Call OpenRouter API
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': 'openrouter/free',  # Using free model
            'messages': session['conversation'],
            'temperature': 0.7
        }
        
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        ai_message = result['choices'][0]['message']['content']
        
        # Add AI response to conversation
        session['conversation'].append({
            'role': 'assistant',
            'content': ai_message
        })
        
        return jsonify({
            'response': ai_message,
            'conversation': session['conversation']
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'API Error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Server Error: {str(e)}'}), 500

@app.route('/reset', methods=['POST'])
def reset():
    session.pop('conversation', None)
    return jsonify({'status': 'Conversation reset'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)