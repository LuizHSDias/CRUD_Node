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
app.use(bodyParser.urlencoded({ extended: false }));

// IMPORTAR MODEL USUARIOS
const Usuario = require('./models/Usuario');

app.use(session({
    secret: 'CriarUmaChaveQualquer1324!blablaba',
    resave: false,
    saveUninitialized: true
}));

// ================= ROTAS =================

app.get('/', (req, res) => {

    if (req.session.erros) {
        const arrayErros = req.session.erros;
        req.session.erros = null;
        return res.render('index', { NavActiveCad: true, error: arrayErros });
    }

    if (req.session.success) {
        req.session.success = false;
        return res.render('index', { NavActiveCad: true, MsgSuccess: true });
    }

    res.render('index', { NavActiveCad: true });
});

app.get('/users', (req, res) => {
    Usuario.findAll()
        .then((valores) => {
            if (valores.length > 0) {
                return res.render('users', {
                    NavActiveUsers: true,
                    table: true,
                    usuarios: valores.map(v => v.toJSON())
                });
            } else {
                return res.render('users', {
                    NavActiveUsers: true,
                    table: false
                });
            }
        })
        .catch((err) => {
            console.log(`Houve um problema: ${err}`);
        });
});

app.post('/editar', (req, res) => {
    const id = req.body.id;

    Usuario.findByPk(id)
        .then((dados) => {
            return res.render('editar', {
                error: false,
                id: dados.id,
                nome: dados.nome,
                email: dados.email
            });
        })
        .catch(() => {
            return res.render('editar', {
                error: true,
                problema: 'Não é possível editar esse registro'
            });
        });
});

// ================= CADASTRO =================

app.post('/cad', (req, res) => {

    let nome = req.body.nome || '';
    let email = req.body.email || '';

    const erros = [];

    // TRIM
    nome = nome.trim();
    email = email.trim();

    // LIMPAR NOME (APENAS LETRAS E ESPAÇOS)
    nome = nome.replace(/[^A-Za-zÀ-ÿ\s]/g, '');

    // VALIDAR NOME
    if (!nome) {
        erros.push({ mensagem: 'Campo nome não pode ser vazio!' });
    } else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
        erros.push({ mensagem: 'Nome inválido!' });
    }

    // VALIDAR EMAIL
    if (!email) {
        erros.push({ mensagem: 'Campo email não pode ser vazio!' });
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        erros.push({ mensagem: 'Campo email inválido!' });
    }

    // SE HOUVER ERROS
    if (erros.length > 0) {
        req.session.erros = erros;
        req.session.success = false;
        return res.redirect('/');
    }

    // SALVAR NO BANCO
    Usuario.create({
        nome: nome,
        email: email.toLowerCase()
    })
        .then(() => {
            req.session.success = true;
            return res.redirect('/');
        })
        .catch((erro) => {
            console.log(`Erro ao cadastrar: ${erro}`);
        });
});

// ================= UPDATE =================

app.post('/update', (req, res) => {

    let nome = req.body.nome || '';
    let email = req.body.email || '';

    const erros = [];

    nome = nome.trim();
    email = email.trim();

    nome = nome.replace(/[^A-Za-zÀ-ÿ\s]/g, '');

    if (!nome) {
        erros.push({ mensagem: 'Campo nome não pode ser vazio!' });
    } else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
        erros.push({ mensagem: 'Nome inválido!' });
    }

    if (!email) {
        erros.push({ mensagem: 'Campo email não pode ser vazio!' });
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        erros.push({ mensagem: 'Campo email inválido!' });
    }

    if (erros.length > 0) {
        return res.status(400).send({ status: 400, erro: erros });
    }

    Usuario.update(
        {
            nome: nome,
            email: email.toLowerCase()
        },
        {
            where: { id: req.body.id }
        }
    )
        .then(() => res.redirect('/users'))
        .catch((err) => console.log(err));
});

// ================= SERVER =================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
