import { useState } from 'react';
import Greeting from './components/Greeting';

function App() {
    const [completed, setCompleted] = useState(false);

    return (
        <main className="page-shell">
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
        </main>
    );
}

export default App;
