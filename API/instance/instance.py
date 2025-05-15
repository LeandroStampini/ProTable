import json
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS 

app = Flask(__name__,
            static_folder='../../page',  
            static_url_path='/')

CORS(app, resources={
    r"/buscar_dados": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500"],
        "methods": ["GET"]
    }
})

BASE_DIR = os.path.abspath(os.path.dirname(__file__))  # pasta onde está seu script
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')

# cria a pasta instance caso não exista
if not os.path.exists(INSTANCE_DIR):
    os.makedirs(INSTANCE_DIR)

db_path = os.path.join(INSTANCE_DIR, 'protable.db')

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class ProtheusTabelas(db.Model):
    __tablename__ = 'protheus_tabelas'
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.String(100), nullable=True)

def criar_contexto_aplicacao():
    if ProtheusTabelas.query.first():
        return 


    json_path = os.path.join(os.path.dirname(__file__), "API", "crawlerObject.json")

    if not os.path.exists(json_path):
        print(f"Arquivo JSON não encontrado: {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as json_object:
        crawlerObject = json.load(json_object)

    for item in crawlerObject:
        codigo = item.get('codigo')
        descricao = item.get('descricao', '')
        if codigo:
            novo_dado = ProtheusTabelas(codigo=codigo, descricao=descricao)
            db.session.add(novo_dado)
    db.session.commit()

@app.route('/buscar_dados', methods=['GET'])
def buscar_dados():
    dados = ProtheusTabelas.query.all()
    resultado = [{'codigo': dado.codigo, 'descricao': dado.descricao} for dado in dados]
    
    # Adicione headers explícitos
    response = jsonify(resultado)
    response.headers['Content-Type'] = 'application/json'
    response.headers['Access-Control-Allow-Origin'] = 'http://127.0.0.1:5500'
    return response

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/resources/<path:filename>')
def recursos(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        criar_contexto_aplicacao()
    app.run(debug=True)
