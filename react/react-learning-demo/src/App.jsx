import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Greeting from './components/Greeting';
import Home from './pages/Home';

function App() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [completed, setCompleted] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [items, setItems] = useState(['学习 JSX', '理解 props']);

    const addItem = (event) => {
        event.preventDefault();
        const value = newItem.trim();

        if (!value) return;

        setItems([...items, value]);
        setNewItem('');
    };

    const removeItem = (indexToRemove) => {
        setItems(items.filter((_, index) => index !== indexToRemove));
    };

    const handleLogin = (event) => {
        event.preventDefault();

        if (username !== 'admin' || password !== 'password') {
            setLoginError('账号或密码不正确，请重新输入。');
            return;
        }

        setLoginError('');
        setIsLoggedIn(true);
        navigate('/home');
    };

    if (!isLoggedIn) {
        return (
            <main className="login-page">
                <section className="login-card" aria-labelledby="login-title">
                    <div className="login-mark" aria-hidden="true">⚛</div>
                    <p className="eyebrow">REACT LEARNING SPACE</p>
                    <h1 id="login-title">欢迎回来</h1>
                    <p className="login-description">登录后即可查看并管理你的学习清单。</p>

                    <form className="login-form" onSubmit={handleLogin}>
                        <label>
                            账号
                            <input
                                type="text"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="请输入你的账号"
                                autoComplete="username"
                            />
                        </label>
                        <label>
                            密码
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="请输入你的密码"
                                autoComplete="current-password"
                            />
                        </label>
                        {loginError && <p className="login-error" role="alert">{loginError}</p>}
                        <button className="login-button" type="submit">登入学习空间 <span>→</span></button>
                    </form>
                    <p className="demo-note">请输入正确的账号和密码以进入学习空间。</p>
                </section>
            </main>
        );
    }

    if (pathname === '/home') {
        return <Home
            username={username}
            itemCount={items.length}
            completed={completed}
            onLogout={() => {
                setIsLoggedIn(false);
                navigate('/', { replace: true });
            }}
        />;
    }

    return (
        <main className="page-shell">
            <div className="user-bar">
                <span>你好，<b>{username}</b></span>
                <div>
                    <button type="button" onClick={() => navigate('/home')}>返回 Home</button>
                    <button type="button" onClick={() => {
                        setIsLoggedIn(false);
                        navigate('/', { replace: true });
                    }}>退出登入</button>
                </div>
            </div>
            <section className="hero-card">
                <div className="hero-copy">
                    <p className="eyebrow"><span>✦</span> REACT LEARNING DEMO</p>
                    <h1>从一个小组件，开始认识 React。</h1>
                    <p className="intro">
                        这是一个简洁的练习页面，展示 JSX、组件拆分与状态更新如何一起工作。
                    </p>
                    <button
                        className={completed ? 'primary-button is-complete' : 'primary-button'}
                        type="button"
                        onClick={() => setCompleted(!completed)}
                    >
                        <span>{completed ? '✓' : '→'}</span>
                        {completed ? '已完成第一课' : '标记为已学习'}
                    </button>
                </div>
                <div className="hero-orb" aria-hidden="true">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <span>⚛</span>
                </div>
            </section>

            <section className="content-grid" aria-label="学习内容">
                <Greeting name="Student" />

                <article className="lesson-card">
                    <div className="lesson-heading">
                        <span className="lesson-icon">01</span>
                        <div>
                            <p className="card-label">TODAY'S LESSON</p>
                            <h2>组件是可复用的 UI</h2>
                        </div>
                    </div>
                    <p>
                        <code>&lt;Greeting /&gt;</code> 被单独放在 components 文件夹中，再通过 props 接收名字并显示出来。
                    </p>
                    <div className="code-line"><span>const</span> name = <b>"Student"</b>;</div>
                </article>
            </section>

            <section className="next-steps" aria-label="下一步学习内容">
                <p className="card-label">KEEP EXPLORING</p>
                <div className="step-list">
                    <span><i>1</i> JSX</span>
                    <span><i>2</i> Props</span>
                    <span><i>3</i> State</span>
                </div>
            </section>

            <section className="todo-card" aria-labelledby="todo-title">
                <div className="todo-heading">
                    <div>
                        <p className="card-label">PRACTICE WITH STATE</p>
                        <h2 id="todo-title">我的练习清单</h2>
                    </div>
                    <span className="item-count">{items.length} 项</span>
                </div>

                <form className="add-form" onSubmit={addItem}>
                    <input
                        value={newItem}
                        onChange={(event) => setNewItem(event.target.value)}
                        placeholder="例如：练习 useState"
                        aria-label="新增练习事项"
                    />
                    <button type="submit">追加</button>
                </form>

                {items.length > 0 ? (
                    <ul className="todo-list">
                        {items.map((item, index) => (
                            <li key={`${item}-${index}`}>
                                <span className="check-mark">✓</span>
                                <span>{item}</span>
                                <button type="button" onClick={() => removeItem(index)}>
                                    删除
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="empty-state">清单还是空的，先添加一项练习吧。</p>
                )}
            </section>
        </main>
    );
}

export default App;
