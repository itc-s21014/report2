const express = require('express');
const router = express.Router();
const prisma = require('../index');

// 各証明書の発行費用
const PRICES = {
  certificate_of_enrollment: 200,
  transcript: 200,
  attendance_certificate: 200,
  certificate_of_expected_graduation: 200,
  graduation_certificate: 200,
  health_certificate: 100,
};

/**
 * 証明書IDとその枚数のデータから、合計枚数と合計金額を返します
 * @param detail 証明書IDとその枚数のデータ
 * @returns {{total_copy: number, total_amount: number}}
 */
const calculate = (detail) => {
  // 足し算する関数
  const sum = (x, y) => {
    // undefinedの対処
    if (!x) x = 0
    if (!y) y = 0
    return x + y
  }
  // detailのvalue（枚数）だけを取って、reduceで合算する
  const total_copy = Object.values(detail).reduce(sum);
  // detailのkey（証明書の種類）をcertTypeに入れて
  // 各証明書の枚数と費用を計算する
  const total_amount = Object.keys(detail)
    .map(certType => {
      const copies = detail[certType]
      // undefinedの対処
      if (!copies) return 0
      return copies * PRICES[certType]
    });
    .reduce(sum)
  return {
    total_copy: total_copy,
    total_amount: total_amount
  }
}

router.get('/', async (req, res) => {
  const student = res.locals.student
  const applications = await prisma.certificateApplication.findMany({
    where: {
      student_id: student.id
    },
  })
  const data = applications.map((application) => {
    // CertificateApplicationテーブルのデータから、証明書の枚数のデータだけをdetailに入れる
    const {id, student_id, created_at, scheduled_date, ...detail} = application
    const {total_copy, total_amount} = calculate(detail)
    return {
      id,
      ...detail,
      created_at: created_at,
      scheduled_date: scheduled_date,
      total_copy: total_copy,
      total_amount: total_amount
    }
  })
  return res.json(data)
})

router.post('/apply', async (req, res) => {
  const student = res.locals.student
  const {
    certificate_of_enrollment,
    transcript,
    attendance_certificate,
    certificate_of_expected_graduation,
    graduation_certificate,
    health_certificate
  } = req.body
  // 後で何回か使うので、分けておく
  // 指定されていない種類の値はundefinedになるので、後の処理ではそれを考慮する必要がある
  const applyDetail = {
    certificate_of_enrollment: certificate_of_enrollment,
    transcript: transcript,
    attendance_certificate: attendance_certificate,
    certificate_of_expected_graduation: certificate_of_expected_graduation,
    graduation_certificate: graduation_certificate,
    health_certificate: health_certificate
  }
  await prisma.certificateApplication.create({
    data: {
      student_id: student.id,
      ...applyDetail
    }
  }).then((result) => {
    const {total_copy, total_amount} = calculate(applyDetail)
    return res.json({
      status: 0,
      receipt: applyDetail,
      scheduled_date: result.scheduled_date,
      total_copy: total_copy,
      total_amount: total_amount
    })
  }).catch(() => {
    return res.json({status: 1})
  })
})

module.exports = router
