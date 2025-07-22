function App() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>RepoTomo Test</h1>
      <p>もし、この画面が表示されていれば、基本的な動作は正常です。</p>
      <button onClick={() => alert('ボタンクリック成功！')}>
        テストボタン
      </button>
    </div>
  )
}

export default App