import * as dao from "./dao.js";

export default function UserRoutes(app) {
      const updateUserCoins = async (req, res) => {
        const { username } = req.params;
        const { coins } = req.body;
        const status = await dao.updateUserCoins(username, coins);
        res.json(status);
      };

      const signIn = async (req, res) => {
        const { username, password } = req.body;
        const currentUser = await dao.findUserByCredentials(username, password);
        if (!currentUser) {
          res.status(401).json({ message: "Incorrect username or password." });
          return;
        }
        req.session["currentUser"] = currentUser;
        res.json(currentUser);
      };

      const signOut = (req, res) => {
        req.session.destroy();
        res.sendStatus(200);
      };

      const signUpAsUser = async (req, res) => {
        const existingUser = await dao.findUserByUsername(req.body.username);
        if (existingUser) {
          res.status(400).json({ message: "Username already exists." });
          return;
        }
        const newUser = await dao.createUser(req.body);
        req.session["currentUser"] = newUser;
        res.json(newUser);
      };

      const signUpAsAdmin = async (req, res) => {
        const existingUser = await dao.findUserByUsername(req.body.username);
        if (existingUser) {
          res.status(400).json({ message: "Username already exists." });
          return;
        }

        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
        if (req.body.admin_password !== ADMIN_PASSWORD) {
          res.status(401).json({ message: "Incorrect admin password." });
          return;
        }

        const newUser = await dao.createAdmin(req.body);
        req.session["currentUser"] = newUser;
        res.json(newUser);
      };


  app.put("/api/users/:username/coins", updateUserCoins);
  app.post("/api/users/signin", signIn);
  app.post("/api/users/signout", signOut);
  app.post("/api/users/signup-user", signUpAsUser);
  app.post("/api/users/signup-admin", signUpAsAdmin);
}
