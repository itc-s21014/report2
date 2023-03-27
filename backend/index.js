import

const express = require('express');
const session = require('express-session');
const app = express();
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

require('dotenv').config();

const env_list = {
  DATABASE_URL: 'データベース接続用のURL',
  SESSION_SECRET: 'セッション用の秘密鍵',
};

const env = Object.keys(env_list).map(k => process.env[k]);

if (Object.values(env).includes(undefined)) {
  console.log('必要な環境変数を.envファイルに設定してください');
  console.log('環境変数一覧：');
  Object.keys(env_list).forEach(e => console.log(`${e}: ${env_list[e]}`))
  process.exit(1);
}
module.exports = prisma;

app.use(express.json());

app.use(session({
  store: new (require('connect-pg-simple')(session))({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}))

// セッションに学生IDがあって、そのIDのStudentが存在する場合は次に進める
// ある場合はres.locals.studentにデータを入れる
// それ以外は {"status": 1} を返す
const checkAuth = async (req, res, next) => {
  const {student_id} = req.session
  if (student_id) {
    const student = await prisma.student.findFirst({
      where: {
        id: student_id,
      },
    });
    if (student) {
      res.locals.student = student;
      return next();
    }
  }
  return res.json({status: 1})
};

const userRouter = require('./routes/user');
const absencesRouter = require('./routes/absences');
const certificateRouter = require('./routes/certificate');

app.use(userRouter);
app.use('/absences', checkAuth, absencesRouter);
app.use('/certificate', checkAuth, certificateRouter);

app.listen(3000, () => console.log('listening on 3000'));
