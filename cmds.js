
const Sequelize = require('sequelize');
const {models} = require('./model');
const {log, biglog, errorlog,colorize} = require("./out");
const process = require('process');



exports.helpCmd = (socket, rl) => {
	log(socket,'Commandos:');
    log(socket,"  h|help - Muestra esta ayuda.");
    log(socket,"  list - Listar los quizzes existentes.");
    log(socket,"  show <id> - Muestra la pregunta y a respuesta el quiz indicado.");
    log(socket,"  add - Añadir un nuevo quiz interactivamente.");
    log(socket,"  delete <id> - Borrar el quiz indicado.");
    log(socket,"  edit <id> - Editar el quiz indicado.");
    log(socket,"  test <id> - Probar el quiz indicado.");
    log(socket,"  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket,"  credits - Créditos.");
    log(socket,"  q|quit - Salir del programa.");
    rl.prompt();
};


exports.quitCmd = (socket,rl )=> {
	rl.close();
	socket.end();
};



const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

exports.addCmd = (socket,rl) => {

		makeQuestion(rl, ' Introduzca la pregunta: ')
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
		log(socket,` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidateError, error => {
		errorlog(socket,'El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(socket,message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});

};

exports.listCmd = (socket,rl) => {

	models.quiz.findAll()
	.each(quiz =>{
			log(socket,` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`);
	})
	.catch( error => {
		errorlog(socket,error.message);
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




exports.showCmd = (socket,rl,id) => {

	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id = ${id}.`);
		}
		log(socket,`  [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(socket,error.message);
	})
	.then(() => {
		rl.prompt();

	});
};

exports.testCmd = (socket,rl,id) => {

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
				log(socket,'Correcto');
				biglog(socket,`CORRECTA`,'green');
			}else{
				log(socket,'Incorrecto');
				biglog(socket,'INCORRECTA','red');
			}
		})
	})
	.catch(error => {
			errorlog(socket,error.message);
	})
	.then(() => {
			rl.prompt();
	})

};

exports.deleteCmd = (socket,rl,id) => {

	validateId(id)
	.then(id=> models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(socket,error.message);
	})
	.then(() => {
		rl.prompt();
	});

};

exports.editCmd = (socket,rl,id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}

		process.stdout.isTTY && setTimeout(() => {socket.write(quiz.question)},0);
		return makeQuestion(rl, ' Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {socket.write(quiz.answer)},0);
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
		log(socket,`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket,'El quiz es erróneo:');
		error.errors.forEach(({message}) => errorLog(socket,message));
	})
	.catch(error => {
		errorlog(socket,error.message);
	})
	.then(() => {
		rl.prompt();
	});

};

exports.playCmd = (socket,rl) => {

	let score = 0;

	var indices = [];


	const playOne = () => {
		return Sequelize.Promise.resolve()
			.then(() =>{
				if (indices.length===0){
					log(socket,'No hay nada más que preguntar.', 'red');
					log(socket,`Fin del juego. Aciertos: ${score}`);
					biglog(socket,`${score}`,'magenta');
					return;

				}else{
					let idr = Math.floor(Math.random()*indices.length);

					let id = indices[idr];
					indices.splice(idr,1);

					return makeQuestion(rl, ` ${id.question}  : `)
					.then(answer =>{
						if(answer.toLowerCase().trim() === id.answer.toLowerCase().trim()){
							score++;
							log(socket,`CORRECTO - Lleva ${score} aciertos.`, 'green');
							return playOne();
						}else{
							log(socket,'INCORRECTO.', 'red');
							log(socket,`Fin del juego. Aciertos: ${score}`);
							biglog(socket,`${score}`,'magenta');
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
				errorlog(socket,error.message);
			})
			.then(() => {
				rl.prompt();
			});

};

exports.creditsCmd = (socket,rl) => {
	log(socket,'Autor de la práctica:');
    log(socket,'DANIEL ALBARES','green');
    rl.prompt();
};
