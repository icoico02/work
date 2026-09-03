import React from 'react';

const Greeting = ({ name }) => {
    return (
        <article className="greeting-card">
            <div className="avatar" aria-hidden="true">👋</div>
            <div>
                <p className="card-label">A COMPONENT IN ACTION</p>
                <h2>Hello, {name}!</h2>
                <p>这段问候来自独立的 Greeting 组件。</p>
            </div>
        </article>
    );
};

export default Greeting;
