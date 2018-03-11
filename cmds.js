
const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');

exports.helpCmd = rl => {
    log(" Comandos");
    log("   h|help - Muestra esta ayuda");
    log("   list - Listar los quizzes que existen");
    log("   show <id> - Muestra la pregunta y la respuesta el quiz indicado");
    log("   add - Añadir un nuevo quiz interactivamente");
    log("   delete <id> - Borrar el quiz indicado");
    log("   edit <id> - Editar el quiz indicado");
    log("   test <id> - Probar el quiz indicado");
    log("    p|play - Jugar a preguntar aleatoriamente todos los quizzes");
    log("   credits - Creditos");
    log("   q|quit - Salir del programa");
    rl.prompt();
};

exports.quitCmd = rl => {
    rl.close();
    rl.prompt();
};



const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
        resolve(answer.trim());
});
});
};



exports.listCmd = rl => {

    models.quiz.findAll()
        .each(quiz =>{
        log(` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`);
})
.catch( error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
});
};


const validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined"){
        reject( new Error(`Falta el parámetro <id>.`));
    } else{
        id = parseInt(id);
        if (Number.isNaN(id)) {
            reject(new Error(`El valor del parámetro <id> no es un número. `));
        } else{
            resolve(id);
        }
    }
});
};




exports.showCmd = (rl,id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if (!quiz) {
        throw new Error(`No existe un quiz asociado al id = ${id}.`);
    }
    log(`  [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();

});
};

exports.addCmd = rl => {

    makeQuestion(rl, ' Introduzca una pregunta: ')
        .then(q => {
        return makeQuestion(rl, ' Introduzca la respuesta: ')
            .then(a => {
            return {question: q, answer: a};
});
})
.then(quiz => {
        return models.quiz.create(quiz);
})
.then((quiz) => {
        log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
})
.catch(Sequelize.ValidateError, error => {
        errorLog('El quiz es erroneo:');
    error.errors.forEach(({message}) => errorLog(message));
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
});

};

exports.deleteCmd = (rl,id) => {

    validateId(id)
        .then(id=> models.quiz.destroy({where: {id}}))
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
});

};

exports.editCmd = (rl,id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if (!quiz) {
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
    return makeQuestion(rl, ' Introduzca la pregunta: ')
        .then(q => {
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
    return makeQuestion(rl, ' Introduzca la respuesta: ')
        .then(a => {
        quiz.question = q;
    quiz.answer = a;
    return quiz;
});
});
})
.then(quiz =>{
        return quiz.save();
})
.then(quiz => {
        log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
})
.catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erróneo:');
    error.errors.forEach(({message}) => errorLog(message));
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
});

};

exports.testCmd = (rl,id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if (!quiz) {
        throw new Error(`No existe un quiz asociado al id = ${id}.`);
    }
    return makeQuestion(rl, ` ${quiz.question}  : `)
        .then(answer =>{
        if(typeof ans===undefined){
        throw new Error('No ha introducido una respuesta válida.');
    }
    if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
        log('Correcto');
        biglog(`CORRECTA`,'green');
    }else{
        log('Incorrecto');
        biglog('INCORRECTA','red');
    }
})
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
})

};


exports.playCmd = rl => {

    let score = 0;

    var indices = [];


    const playOne = () => {
        return Sequelize.Promise.resolve()
            .then(() =>{
            if (indices.length===0){
            log('No hay nada más que preguntar.', 'red');
            log(`Fin del juego. Aciertos: ${score}`);
            biglog(`${score}`,'magenta');
            return;

        }else{
            let idr = Math.floor(Math.random()*indices.length);

            let id = indices[idr];
            indices.splice(idr,1);

            return makeQuestion(rl, ` ${id.question}  : `)
                .then(answer =>{
                if(answer.toLowerCase().trim() === id.answer.toLowerCase().trim()){
                score++;
                log(`CORRECTO - Lleva ${score} aciertos.`, 'green');
                return playOne();
            }else{
                log('INCORRECTO.', 'red');
                log(`Fin del juego. Aciertos: ${score}`);
                biglog(`${score}`,'magenta');
                return;
            }
        })
        }
    })

    };

    models.quiz.findAll()
        .then(quiz => {
        indices = quiz;
})
.then(() => {
        return playOne();
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
});

};

exports.creditsCmd = rl =>{
    log('Autor de la práctica');
    log('Daniel Albares', 'green');
    rl.prompt();
};