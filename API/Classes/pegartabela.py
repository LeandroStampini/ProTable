from bs4 import BeautifulSoup
import requests
import json
crawlerObject=[]
#Url do site 
url="https://terminaldeinformacao.com/wp-content/tabelas/aa1.php"

response= requests.get(url)
if response.status_code==200:
    html =response.text
    soup = BeautifulSoup(html,'html.parser')
    #pega o primeiro elemento html que tem table
    table_element = soup.find('table')

            # pega o primeiro elemento tbody dentro da table anterior
    tb=table_element.find('tbody')

            # um for para rodar o nuemro de vezes que tiver tr dentro do tbody 
    for h in range(len(tb.find_all('tr'))):
                #pega todos os td dentro da primeira tabela
        td=table_element.find_all('td')
        aelement = table_element.find_all('a')
        

                #pega o campo a[h] e trasforma em texto
        texto_do_link = aelement[h].text

                #pega os ekementos td que sao as descrições da posicao começando em 2 e somando 2*h para sempre conseguir pegar a descrição
        
        textterceiro=td[(2+(h*6))].text
        codigo=texto_do_link
        descricao=textterceiro
        itens= {"codigo":codigo,"descricao":descricao}
        crawlerObject.append(itens)
        with open("crawlerObject.json", "w") as arquivo_json:
            json.dump(crawlerObject, arquivo_json,indent=4)


    ul=soup.find("ul", id="tabsUL")
    lista=ul.find_all("li")
    for i in range(len(lista)):
        a=lista[i].find_all("a")
        x=a[0]['href']
        url=f"https://terminaldeinformacao.com/wp-content/tabelas/{x}"
        response = requests.get(url)

    #Verifica se a solicitação foi bem-sucedida (código de resposta 200)
        if response.status_code == 200:
            # Obtém o conteúdo HTML da página
            html = response.text

            # Cria um objeto BeautifulSoup para analisar o HTML
            soup = BeautifulSoup(html, 'html.parser')

            #pega o primeiro elemento html que tem table
            table_element = soup.find('table')
            h1=soup.find("h1")
            nome=h1.text

            # pega o primeiro elemento tbody dentro da table anterior
            tb=table_element.find('tbody')

            # um for para rodar o nuemro de vezes que tiver tr dentro do tbody 
            for j in range(len(tb.find_all('tr'))):

                #pega todos os td dentro da primeira tabela
                td=table_element.find_all('td')
                #pega o elemento da "a" dentro da table
                a_element = table_element.find_all('a')

                #pega o campo a[j] e trasforma em texto
                texto_do_link = a_element[j].text

                #pega os ekementos td que sao as descrições da posicao começando em 2 e somando 2*j para sempre conseguir pegar a descrição
                textterceiro=td[(2+(j*6))].text
                codigo=texto_do_link
                descricao=textterceiro
                itens= {"codigo":codigo,"descricao":descricao}
                crawlerObject.append(itens)
                with open("crawlerObject.json", "w") as arquivo_json:
                    json.dump(crawlerObject, arquivo_json,indent=4)

                

        
            


        


