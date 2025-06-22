const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const courseValidation = require("../validation").courseValidation;
const User = require("../models").user;
const jwt = require("jsonwebtoken");

router.use((req, res, next) => {
  console.log("正在接收一个跟auth有关的请求");
  next();
});

router.get("/testAPI", (req, res) => {
  return res.send("成功连接auth route...");
});

router.post("/register", async (req, res) => {
  //确认注册数据是否符合规范
  let { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  //确认信箱是否注册过
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("此信箱已经被注册过了了...");
  //制作新用户
  let { email, username, password, role } = req.body;
  let newUser = new User({ email, username, password, role });
  try {
    let savedUser = await newUser.save();
    return res.send({
      msg: "使用者成功储存.",
      savedUser,
    });
  } catch (e) {
    return res.status(500).send("无法储存使用者...");
  }
});

router.post("/login", async (req, res) => {
  let { error } = loginValidation(req.body);
  if (error)
    return res
      .status(400)
      .send("loginValidation-Error" + error.details[0].message);
  //确认信箱是否注册过
  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) {
    return res.status(401).send("无法找到使用者，请检查邮箱是否正确...");
  }

  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) return res.status(500).send(err.message);
    if (isMatch) {
      const tokenObject = { _id: foundUser.id, email: foundUser.email };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res.send({
        message: "成功登陆",
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      return res.status(401).send("密码错误");
    }
  });
});

module.exports = router;
