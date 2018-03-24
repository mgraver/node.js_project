CREATE TABLE person (
	id			 SERIAL			PRIMARY KEY NOT NULL,
	first_name   VARCHAR(20)   	NOT NULL,
	last_name    VARCHAR(20)    NOT NULL,
	birth_date	 DATE           NOT NULL,
	Sex			 BOOLEAN		NOT NULL
);

CREATE TABLE relations(
	father		INT      REFERENCES person(id)   ,
	mother		INT		 REFERENCES person(id)   ,
	child		INT		 REFERENCES person(id)   NOT NULL
);

INSERT INTO person (first_name, last_name, birth_date, Sex) VALUES ('anakin', 'skywalker', (to_date('1999-05-19', 'YYYY-MM-DD')), TRUE);
INSERT INTO person (first_name, last_name, birth_date, Sex) VALUES ('padmé', 'amidala', (to_date('1999-05-19', 'YYYY-MM-DD')), FALSE);

INSERT INTO person (first_name, last_name, birth_date, Sex) VALUES ('luke', 'skywalker', (to_date('2020-01-29', 'YYYY-MM-DD')), TRUE);
INSERT INTO person (first_name, last_name, birth_date, Sex) VALUES ('leia', 'skywalker', (to_date('2020-01-29', 'YYYY-MM-DD')), FALSE);

INSERT INTO relations (father, mother, child) VALUES ((SELECT id FROM person WHERE first_name = 'anakin'), (SELECT id FROM person WHERE first_name = 'padmé'), 
	 													  (SELECT id FROM person WHERE first_name = 'luke'));

INSERT INTO relations (father, mother, child) VALUES ((SELECT id FROM person WHERE first_name = 'anakin'), (SELECT id FROM person WHERE first_name = 'padmé'), 
	 													  (SELECT id FROM person WHERE first_name = 'leia'));