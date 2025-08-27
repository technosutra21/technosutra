# Techno Sutra AR

## Visão Geral do Projeto

Techno Sutra AR é uma experiência imersiva em realidade aumentada que explora os 56 capítulos do Avatamsaka Sutra (Sutra Gandavyuha) através de modelos 3D interativos. O projeto visa popularizar o uso de dispositivos tecnológicos portáteis, como smartphones, para fins dhármicos e de conscientização, criando uma ponte entre a tradição budista e a tecnologia moderna.

Através do desenvolvimento de uma aplicação web progressiva (PWA) com recursos de realidade aumentada (AR), o projeto permite que usuários visualizem modelos 3D representando os diferentes capítulos e personagens do Sutra, tanto em uma galeria virtual quanto em seu ambiente real através da câmera do dispositivo.

O projeto utiliza o Resumo Detalhado do Sutra da Matriz-Tronco como referência para a criação de uma rede de 56 Pontos de Conexão, um para cada capítulo do texto. Os usuários podem seguir os passos de Suddhana por um caminho físico ou virtual. Ao chegar a esses Pontos de Conexão, eles encontrarão um código QR que, ao ser escaneado, exibirá na tela de seus dispositivos, sobrepondo a imagem da câmera, um personagem 3D e outras informações sobre um capítulo específico do sutra.

## Recursos

* **Realidade Aumentada:** Visualização de modelos 3D em smartphones através da tecnologia WebXR e model-viewer.
* **Experiência Imersiva:** Interface intuitiva e envolvente que combina elementos visuais, sonoros e interativos.
* **Aplicação Web Progressiva (PWA):** Funciona offline e pode ser instalada como um aplicativo nativo.
* **Peregrinação Interativa:** Uma jornada inspirada em rotas de peregrinação antigas, como as do Japão e o Caminho da Fé no Brasil.
* **Conteúdo Dhármico:** Textos e modelos 3D baseados no Sutra Gandavyuha e outros textos budistas.
* **Multilíngue:** Suporte para português e inglês, com possibilidade de expansão para outros idiomas.
* **Responsivo:** Funciona em diversos dispositivos, desde smartphones até tablets e desktops.

## Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Realidade Aumentada:** model-viewer, WebXR
* **PWA:** Service Workers, Web App Manifest
* **3D Models:** glTF/GLB, USDZ (para iOS)
* **Ferramentas de Desenvolvimento:** Python (scripts de processamento)

## Estrutura do Projeto

* **`/AR.html`**: Página de experiência em realidade aumentada.
* **`/galeria.html`**: Galeria de modelos 3D interativos.
* **`/index.html`**: Página inicial da aplicação.
* **`/offline.html`**: Página exibida quando o usuário está offline.
* **`/css/`**: Folhas de estilo para o frontend da aplicação.
  * **`/css/shared.css`**: Estilos compartilhados entre todas as páginas.
  * **`/css/main.css`**: Estilos específicos para a página inicial.
* **`/js/`**: Código JavaScript para o frontend da aplicação.
  * **`/js/utils.js`**: Utilitários compartilhados (tema, idioma, PWA).
  * **`/js/ar-experience.js`**: Controlador da experiência AR.
  * **`/js/gallery.js`**: Controlador da galeria de modelos.
* **`/models/`**: Modelos 3D no formato GLB para visualização em AR.
* **`/usdz/`**: Modelos 3D no formato USDZ para visualização em iOS.
* **`/qr_codes/`**: Códigos QR para acesso aos modelos AR.
* **`/summaries/`**: Resumos dos capítulos do Sutra em diferentes formatos.
* **`/sw.js`**: Service Worker para funcionalidade offline.
* **`/manifest.json`**: Manifesto da aplicação web progressiva.

## Instalação e Uso

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/technosutra.git
   ```

2. Navegue até o diretório do projeto:
   ```
   cd technosutra
   ```

3. Inicie um servidor local (exemplo com Python):
   ```
   python -m http.server 8000
   ```

4. Acesse a aplicação em seu navegador:
   ```
   http://localhost:8000
   ```

Para uma experiência completa de AR, recomenda-se acessar a aplicação em um dispositivo móvel com suporte a WebXR ou através de um servidor HTTPS.

## Contribuição

Contribuições são bem-vindas! Se você deseja contribuir com o projeto, siga estas etapas:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit de suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Visão Budista

Techno Sutra AR, com seus 56 Pontos de Conexão relacionados aos capítulos do Sutra Gandavyuha, serve como uma ponte entre a tradição budista milenar e a tecnologia contemporânea. Este projeto utiliza a realidade aumentada como um meio hábil (upaya) para tornar os ensinamentos mais acessíveis e envolventes, convidando os usuários a explorar os conceitos de interdependência, compaixão e sabedoria através de uma experiência imersiva e interativa.

A jornada de Suddhana, representada nos modelos 3D e nos textos, simboliza a busca espiritual universal e o caminho para a iluminação, agora acessível através da tecnologia moderna. O projeto não busca substituir os métodos tradicionais de estudo e prática, mas complementá-los, oferecendo uma nova porta de entrada para aqueles que possam se beneficiar de uma abordagem mais visual e interativa dos ensinamentos budistas.

