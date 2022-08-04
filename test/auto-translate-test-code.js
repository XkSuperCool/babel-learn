import intl from 'intl2'

function App() {
  const title = 'title'
  const desc = `desc`
  const desc2 = /* intl-disabled */ `desc`
  const desc3 = `aaa ${title + desc} bbb ${desc2} ccc`

  return (
    <div className='app' title={'测试'}>
      <img src={Logo} />
      <h1>${title}</h1>
      <p>${desc}</p>
      <div>{/* intl-disabled */ '中文'}</div>
    </div>
  )
}
