const express = require('express');
const app = express();
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const PORT = process.env.PORT || 3000;

// CONFIGURAÇÃO DO HANDLEBARS
app.engine('hbs', hbs.engine({
    extname: 'hbs',
    defaultLayout: 'main'
}));

app.set('view engine', 'hbs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:false}));

// IMPORTAR MODEL USUARIOS
const Usuario = require('./models/Usuario');

app.use(session({
    secret: 'CriarUmaChaveQualquer1324!blablaba',
    resave: false ,
    saveUninitialized: true
}))

app.get('/', (req, res) => {

    if(req.session.erros){
        var arrayErros = req.session.erros;
        req.session.erros = "";
        return res.render('index', {NavActiveCad:true, error:arrayErros})
    }

    if(req.session.success){
        req.session.success = false;
        return res.render('index', {NavActiveCad:true, MsgSuccess:true})
    }

    res.render('index', {NavActiveCad:true});

})

app.get('/users', (req, res) => {
    Usuario.findAll().then((valores) => {
        // console.log(valores.map(valores => valores.toJSON()));
        if(valores.length > 0){
            return res.render('users', {NavActiveUsers:true, table:true, usuarios: valores.map(valores => valores.toJSON() )});
        } else {
            res.render('users', {NavActiveUsers:true, table: false});
        }
    }).catch((err) => {
        console.log(`Houve um problema: ${err}`);
    })
    // res.render('users', {NavActiveUsers:true});
})

app.get('/editar', (req, res) => {
    res.render('editar');
})

app.post('/cad', (req, res) => {
   // VALORES VINDO DO FORMULÁRIO
   var nome = req.body.nome;
   var email = req.body.email;

   // ARRAY QUE VAI CONTER OS ERROS 
   const erros = [];

   // REMOVER OS ESPAÇOS EM BRANCO ANTES E DEPOIS
   nome = nome.trim();
   email = email.trim();

   // LIMPAR O NOME DE CARACTERES ESPECIAIS (APENAS LETRAS)
   nome = nome.replace(/[^A-zÀ-ú\s]/gi,'');
   console.log(nome);

   // VERIFICAR SE ESTÁ VAZIO OU NÃO CAMPO 
   if (nome == '' || typeof nome == undefined || nome == null){
    erros.push({mensagem: "Campo nome não pode ser vazio!"});
   }

   // VERIFICAR SE O CAMPO NOME É VÁLIDO (APENAS LETRAS)
   if(!/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ\s]+$/.test(nome)){
    erros.push({mensagem:"Nome inválido!"});
   }

   // VERIFICAR SE ESTÁ VAZIO OU NÃO CAMPO 
   if (email == '' || typeof email == undefined || email == null){
    erros.push({mensagem: "Campo email não pode ser vazio!"});
   }

   // VERIFICAR SE EMAIL É VÁLIDO
   if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
    erros.push({mensagem:"Campo email inválido!"});
    }

    if(erros.length > 0){
        console.log(erros);
        req.session.erros = erros;
        req.session.success = false;
        return res.redirect('/');
    }

    // SUCESSO NENHUM ERRO
    // SALVAR NO BANCO DE DADOS

    Usuario.create({
        nome: nome,
        email: email.toLowerCase()
    }).then(function(){
        console.log('Cadastrado com sucesso!');
        req.session.success = true;
        return res.redirect('/');
    }).catch(function(erro){
        console.log(`Ops, houve um erro: ${erro}`)
    })
   

})

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});