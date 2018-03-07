
const {log, biglog, errorlog, colorize} = require("./out");
const model = require('./model');

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

exports.listCmd = rl =>{

    model.getAll().forEach((quiz, id) => {
        log(` [${id}]: ${quiz.question}`);
    });

    rl.prompt();
};
exports.showCmd = (rl, id) =>
{

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} `);
        } catch (error) {
        errorlog(error.message);
        }
    }

    rl.prompt();
};
exports.addCmd = rl =>{

    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

        rl.question(colorize(' Introduzca una respuesta ', 'red'), answer => {

            model.add(question, answer);
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });

};
exports.deleteCmd = (rl, id) =>{

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch (error) {
            errorlog(error.message);
        }
    }

    rl.prompt();
};
exports.editCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);

                rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer} `);
                    rl.prompt();
                });
            });

        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};
exports.testCmd = (rl, id) =>{

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            rl.question(colorize(` ${quiz.question}? `, 'red'), answer => {
                log(' Su respuesta es:');

                if(answer.trim().toLowerCase() === quiz.answer.toLowerCase()) {
                log(` La respuesta es correcta  `);
                biglog('Correcta', 'green');
                } else {
                log(` La respuesta es incorrecta `);
                biglog('Incorrecta', 'red');
                }
        rl.prompt();
        });


        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

exports.playCmd = rl => {
    let score = 0;
    let toBeResolved = [];
    for (var i = 0; i < model.count(); i++) {
        toBeResolved[i] = i;
    }
    const playOne = () => {
        if (toBeResolved.length === 0) {
            log(' No hay nada más que preguntar');
            log(' Final del examen. Aciertos:');
            biglog(score, 'blue');
            rl.prompt();
        } else {
            let id = toBeResolved[Math.floor(Math.random() * toBeResolved.length)];
            toBeResolved.splice(toBeResolved.indexOf(id), 1);


            let quiz = model.getByIndex(id);


            try {
                rl.question(colorize(` ${quiz.question}? `, 'red'), _answer => {
                    log(' Su respuesta es:');
                if (_answer.trim().toLowerCase() === quiz.answer.toLowerCase()) {
                    score++;
                    log(` correcta - Lleva ${score} aciertos.`);
                    playOne();
                } else {
                    log(' incorrecta.');
                    log(` Final del examen. Aciertos:`);
                    biglog(score, 'magenta');
                    rl.prompt();
                }
            });
            } catch (error) {
                errorLog(error.message);
                rl.prompt();
            }

        }
    }

    playOne();
}

exports.creditsCmd = rl =>{
    log('Autor de la práctica');
    log('Daniel Albares', 'green');
    rl.prompt();
};
exports.quitCmd = rl =>{
    rl.close();
};