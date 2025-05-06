import json
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///protheus_search.db'
db = SQLAlchemy(app)

class protheus_tabelas(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(100))
    descricao = db.Column(db.String(100))

# Adicione a seguinte função para criar o contexto de aplicação
def criar_contexto_aplicacao():
    with app.app_context():
        with open("API/crawlerObject.json", "r") as json_object:
            crawlerObject = json.load(json_object)

        for item in crawlerObject:
            novo_dado = protheus_tabelas(codigo=item['codigo'], descricao=item['descricao'])
            db.session.add(novo_dado)
            db.session.commit()

# Rota para buscar dados
@app.route('/buscar_dados', methods=['GET'])
def buscar_dados():
    dados = protheus_tabelas.query.all()
    resultado = [{'codigo': dado.codigo, 'descricao': dado.descricao} for dado in dados]
    return jsonify(resultado)

if __name__ == '__main__':
    # Crie o contexto de aplicação antes de iniciar o servidor
    with app.app_context():
        db.create_all()
        criar_contexto_aplicacao()

    # Inicie o servidor Flask
    app.run(debug=True)
