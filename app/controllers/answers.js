const Answer = require('../models/answers');

class AnswerController {
  async find(ctx) {
    const { per_page = 10 } = ctx.query;
    const page = Math.max(ctx.query.page * 1, 1) -1;
    const perPage = Math.max(per_page * 1, 1);
    const q = new RegExp(ctx.query.q);
    ctx.body = await Answer.find({ content: q, questionId: ctx.params.questionId })
                             .limit(perPage).skip(page * perPage);
  }
  async checkAnswerExist(ctx, next) {
    const answer = await Answer.findById(ctx.params.id).select('+answerer');
    if (!answer) {
      ctx.throw(404, '答案不存在');
    }
    // 只有在删改查答案时才检查此逻辑，赞和踩答案时不检查
    if (ctx.params.questionId && answer.questionId !== ctx.params.questionId) {
      ctx.throw(404, '该问题下没有此答案');
    }
    ctx.state.answer = answer;
    await next();
  }
  async findById(ctx) {
    const { fields = '' } = ctx.query;
    const selectFields = fields.split(';').filter(item => item).map(item => ' +' + item).join('');
    const answer = await Answer.findById(ctx.params.id).select(selectFields).populate('answer');
    ctx.body = answer;
  }
  async create(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true},
      description: { type: 'string', required: false}
    });
    const answerer = ctx.state.user._id;
    const { questionId } = ctx.params;
    const answer = await new Answer({ ...ctx.request.body, answerer, questionId }).save();
    ctx.body = answer;
  }
  async checkAnswerer(ctx, next) {
    const { answer } = ctx.state;
    if (answer.answerer.toString() !== ctx.state.user._id) {
      ctx.throw(403, '没有权限');
    }
    await next();
  }
  async update(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true}
    });
    await ctx.state.answer.update(ctx.request.body);
    ctx.body = ctx.state.answer;
  }
  async delete(ctx) {
    await Answer.findByIdAndRemove(ctx.params.id);
    ctx.status = 204;
  }
}

module.exports = new AnswerController();