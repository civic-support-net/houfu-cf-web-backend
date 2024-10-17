import { askName, askNameAgain, completeRegister, confirmName, tellWelcome } from './setup'

test('line manager_line/setup message', async () => {
  expect(tellWelcome()).toMatchObject({
    type: 'text',
    text: '友だち追加ありがとうございます。\nこのLINEボットはサイトに反映するメッセージの管理を行うことができます。',
  })
  expect(askName()).toMatchObject({
    type: 'text',
    text: 'まず、お名前を教えてください。（サイトには公開されません）',
  })

  expect(confirmName('hoge')).toMatchObject({
    type: 'template',
    altText: '名前確認',
    template: {
      type: 'confirm',
      actions: [
        { type: 'message', label: 'はい', text: 'はい' },
        { type: 'message', label: 'いいえ', text: 'いいえ' },
      ],
      text: 'お名前は「hoge」でよろしいですか？',
    },
  })
  expect(askNameAgain()).toMatchObject({
    type: 'text',
    text: 'もう一度お名前を教えてください。',
  })

  expect(completeRegister('foo')).toMatchObject({
    type: 'text',
    text: '登録が完了しました。「foo」さん、ありがとうございました。投稿されたメッセージの管理をすることができます。',
  })
})
