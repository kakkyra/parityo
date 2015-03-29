exports.root_url = "localhost";

exports.get_query = 'SELECT * FROM Shortening WHERE osio = {osio}';
exports.add_query = 'INSERT INTO Shortening SET url = {URL}, osio = {osio}, ip = {IP}';
exports.check_url_query = 'SELECT * FROM Shortening WHERE url = {URL}';
exports.check_ip_query = 'SELECT COUNT(id) as counted FROM Shortening WHERE ip = {IP}';

exports.host = 'localhost';
exports.user = 'root';
exports.password = 'xxxxx';
exports.database = 'Taulu';