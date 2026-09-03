import { useNavigate } from 'react-router-dom';

function Home({ username, itemCount, completed, onLogout }) {
    const navigate = useNavigate();

    return (
        <main className="home-page">
            <nav className="home-nav" aria-label="主导航">
                <span className="brand"><i>⚛</i> React Learn</span>
                <div>
                    <span className="nav-user">你好，{username}</span>
                    <button type="button" onClick={onLogout}>退出登入</button>
                </div>
            </nav>

            <section className="home-hero">
                <p className="eyebrow"><span>✦</span> YOUR LEARNING DASHBOARD</p>
                <h1>欢迎回到学习空间，<br />{username}。</h1>
                <p>从小练习开始，逐步掌握 React 的核心概念。今天也来完成一项新的学习任务吧。</p>
                <button className="home-cta" type="button" onClick={() => navigate('/learning')}>
                    进入学习清单 <span>→</span>
                </button>
                <div className="home-orbit" aria-hidden="true">⚛</div>
            </section>

            <section className="home-summary" aria-label="学习概览">
                <article><span className="summary-icon blue">◈</span><div><b>{itemCount}</b><p>待练习项目</p></div></article>
                <article><span className="summary-icon green">✓</span><div><b>{completed ? 1 : 0}</b><p>已完成课程</p></div></article>
                <article><span className="summary-icon purple">⚡</span><div><b>3</b><p>核心知识点</p></div></article>
            </section>

            <section className="quick-start">
                <div>
                    <p className="card-label">CONTINUE LEARNING</p>
                    <h2>从组件和状态开始练习</h2>
                </div>
                <button type="button" onClick={() => navigate('/learning')}>打开课程</button>
            </section>
        </main>
    );
}

export default Home;
