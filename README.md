Simple express application that queries a local MySQL database. 
car is the table. each record is a car make, model, and year

GET /car obtains all records that are not marked as deleted
PUT /car updates a record with a different model year
POST /car creates a new record 
DELETE /car/:id toggles a record as deleted
