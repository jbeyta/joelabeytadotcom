import './App.scss'

function App() {
  return (
    <div className="app-wrapper">
      <div className="content">
        <h1>Joel Abeyta</h1>
        
        <hr className="divider" />
        
        <section className="contact">
          <div className="contact-info">
            <a href="mailto:joel.abeyta@gmail.com">joel.abeyta@gmail.com</a>
            <a href="https://github.com/jbeyta" target="_blank" rel="noopener noreferrer">https://github.com/jbeyta</a>
          </div>
          <a href="/resume.pdf" download className="resume-button">
            Resume
          </a>
        </section>
        
        <hr className="divider" />
        
        <section className="bio">
          <p>
            I am a web developer with 10+ years of experience in PHP, HTML, CSS/SCSS, JS, React, Typescript, SQL, AI "vibe coding", and more.  I have worked on a variety of projects ranging from small business websites to large-scale web applications. I am passionate about creating clean, efficient, and user-friendly web experiences. 
          </p>
        </section>
      </div>
    </div>
  )
}

export default App
