const { generateWebApp } = require('./src/creova/apk/htmlGenerator.js');
const app = {
  appName:'TestAlign',
  screens:[{
    id:'Screen1',
    alignHorizontal:'Center',
    alignVertical:'Center',
    backgroundColor:'#ffffff',
    components:[
      {id:'Button1', type:'Button', props:{text:'CENTRAL BUTTON', backgroundColor:'#3B82F6', textColor:'#ffffff', fontSize:16}, height:-1, width:-1},
      {id:'Label1', type:'Label', props:{text:'Hello World', fontSize:18, textColor:'#333333'}}
    ]
  }],
  blockLogic:''
};
const files = generateWebApp(app);

// Print the generated app.js fully
console.log(files['www/app.js']);
