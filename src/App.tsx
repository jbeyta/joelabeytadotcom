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
          <p><b>Web Development:</b> 14+ years experience|experimentation</p>
          <p><b>Technology:</b> JS, React, Typescript, PHP, SQL, AI coding</p>
        </section>

        <hr className="divider" />

        <section className="projects">
          <p><a href="https:/publicaudioarchive.com" target="_blank" rel="noopener noreferrer">Public Audio Archive</a></p>
        </section>
      </div>
    </div>
  )
}

export default App
