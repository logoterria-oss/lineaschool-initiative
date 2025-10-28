-- Make email and phone nullable in payment_leads table
ALTER TABLE payment_leads 
ALTER COLUMN email SET DEFAULT NULL,
ALTER COLUMN phone SET DEFAULT NULL;

-- Set existing null values
UPDATE payment_leads SET email = NULL WHERE email = '';
UPDATE payment_leads SET phone = NULL WHERE phone = '';
