const bcrypt = require("bcryptjs");

async function hashPassword() {
  const password = "admin123"; // change later
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
}

hashPassword();
