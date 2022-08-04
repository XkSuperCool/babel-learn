function traverseModule(entry) {}

export default traverse

function getUserInfo() {
  return fetch('/user', {
    body: {
      username: 'kkk'
    }
  })
}

getUserInfo()
  .then(res => res.json())
  .then(res => {
    if (res.code !== 0) return alert(res.msg)

    const { username, nickName, role } = res.data

		if (role === 'admin')
			isVip = true
		else if (role === 'super-admin')
			isSuperVip = true
		else
			isPaine = true

  })
