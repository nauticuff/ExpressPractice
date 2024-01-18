Simple express application that queries a local MySQL database. <br>
car is the table. each record is a car make, model, and year <br>

GET /car obtains all records that are not marked as deleted <br>
PUT /car updates a record with a different model year <br>
POST /car creates a new record <br>
DELETE /car/:id toggles a record as deleted
