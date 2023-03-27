const express = require('express');
const router = express.Router();
const prisma = require('../index');

const KIND_NAMES = {
  1: '欠席',
  2: '就活欠席',
  3: '遅刻',
  4: '早退',
};

router.get('/', async (req, res) => {
  const student = res.locals.student;
  const absences = await prisma.absence.findMany({
    where: {
      student_id: student.id,
    },
    include: {
      student: true,
    },
  });
  const data = absences.map((a) => (
    {
      id: a.id,
      kind: KIND_NAMES[a.kind],
      reason: a.reason,
      start_date: a.start_date,
      end_date: a.end_date,
      created_at: a.created_at,
      student_code: a.student.code,
      student_name: a.student.name,
    }
  ))
  return res.json(data);
});

router.post('/add', async (req, res) => {
  const {kind, reason, start_date, end_date} = req.body
  const student = res.locals.student
  await prisma.absence.create({
    data: {
      student_id: student.id,
      kind: kind,
      reason: reason,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : new Date(start_date)
    },
  }).then(() => {
    return res.json({status: 0})
  }).catch(() => {
    return res.json({status: 1})
  }),
});

module.exports = router;
