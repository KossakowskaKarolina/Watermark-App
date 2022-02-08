const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile); // metoda read służy do ładowania plików graficznych; await gwarantuje, że kompilacja nie pójdzie do przodu, dopóki plik nie zostanie załadowany
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // odwołanie do czcionki (Open Sans jest dostępny z paczką, ale możemy załadować własne fonty); loadFont ładuje font
    const textData = {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };

    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight()); // dodajemy napis - pierwszy argument mówi, z jakiej czcionki korzystamy; drugi i trzeci decydują o umiejscowieniu tekstu; czwarty podaje treść; piąty i szósty szerokość i wysokość obrazka
    await image.quality(100).writeAsync(outputFile); // zapisujemy obrazek jako nowy plik, wartość w quality odpowiada 100%

    process.stdout.write('Hooray! Watermark was added!');
    startApp();
  }
  catch(error){
    console.log('Something went wrong... Try again!');
  }
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) { // podobnie jw. ale trzeci parametr otrzymuje ścieżkę do pliku znaku wodnego
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, { // composite służy do łączenia dwóch obrazków ze sobą
      mode: Jimp.BLEND_SOURCE_OVER, // sposób połączenia (watermark na wierzchu)
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);

    process.stdout.write('Hooray! Watermark was added!');
    startApp();
  }
  catch(error){
    console.log('Something went wrong... Try again!');
  }
};

const prepareOutputFilename = (filename) => {
  const [ name, ext ] = filename.split('.');
  return `${name}-with-watermark.${ext}`;
};


const startApp = async () => {

  // Ask if user is ready
  const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }]);

  // if answer is no, just quit the app
  if(!answer.start) process.exit(); // Inquirer zawsze zwraca jako odpowiedź obiekt z atrybutami, nawet jeśli zadajemy tylko jedno pytanie, dlatego musimy się do niego odwołać jako answer.start

  // ask about input file and watermark type
  const options = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  }, {
    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
  }]);

  if(options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
    options.watermarkText = text.value;

    if(fs.existsSync(`./img/${options.inputImage}`)){
      addTextWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), options.watermarkText);
    } else {
      process.stdout.write('Something went wrong... Try again');
    }

  }
  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }]);
    options.watermarkImage = image.filename;

    if(fs.existsSync(`./img/${options.inputImage}`) && fs.existsSync(`./img/${options.watermarkImage}`)){
      addImageWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), './img/' + options.watermarkImage);
    } else {
      process.stdout.write('Something went wrong... Try again');
    }
  }
}

startApp();
