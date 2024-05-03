import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";
import csvParser from "csv-parser";
import fs from "fs";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Estructura de datos para almacenar todos los datos del CSV
let allData: any[] = [];

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.get("/", (req: Request, res: Response) => {
  let filteredData = allData;

  // Verifica si se proporciona un término de búsqueda en la URL
  const searchTerm = req.query.searchTerm as string;
  if (searchTerm) {
    // Filtra los datos en función del término de búsqueda
    filteredData = allData.filter(row => {
      return row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             row.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
             row.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
             row.favourite_sport.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }

  // Genera las cartas HTML a partir de los datos filtrados
  const htmlCards = convertToHTMLCards(filteredData);

  // Envía la página principal con las cartas HTML y la barra de búsqueda
  res.send(`
    <html>
      <head>
        <title>CSV Data Viewer</title>
        <link rel="stylesheet" href="App.css">
      </head>
      <body>
        <h2>Subir Archivo CSV</h2>
        <form action="/api/files" method="post" enctype="multipart/form-data">
          <input type="file" name="fileInput">
          <button type="submit">Subir archivo</button>
        </form>
        <h1>Datos del CSV</h1>
        <form action="/" method="get">
          <input type="text" name="searchTerm" placeholder="Buscar...">
          <button type="submit">Buscar</button>
        </form>
        ${htmlCards} <!-- Inserta las cartas HTML aquí -->
        <hr>
      </body>
    </html>
  `);
});



// Use multer middleware for handling file uploads
app.post("/api/files", upload.single('fileInput'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send('No se ha enviado ningún archivo.');
  }

  // Accede al archivo subido
  const file = req.file;

  // Parsea el CSV y guarda los datos en la estructura de datos en el servidor
  const newData: any[] = [];
  fs.createReadStream(file.path)
    .pipe(csvParser())
    .on('data', (data) => newData.push(data))
    .on('end', () => {
      allData = [...allData, ...newData];

      // Redirige al usuario a la página principal
      res.redirect("/");
    });
});

// Ruta para devolver la tabla HTML con todos los datos
app.get("/api/users", (req: Request, res: Response) => {
  // Genera la tabla HTML a partir de todos los datos almacenados en el servidor
  const htmlTable = convertToHTMLCards(allData);
  res.send(htmlTable);
});

// Función para convertir los datos en cartas HTML
function convertToHTMLCards(data: any[]) {
  let html = '';
  
  // Cartas de datos
  data.forEach(row => {
    html += `
      <div class="card">
        <h2>${row.name}</h2>
        <p><strong>City:</strong> ${row.city}</p>
        <p><strong>Country:</strong> ${row.country}</p>
        <p><strong>Favourite Sport:</strong> ${row.favourite_sport}</p>
      </div>
    `;
  });

  return html;
}


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
