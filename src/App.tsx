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
            I am a web developer with 10+ years of experience in PHP, HTML, CSS/SASS, JS (jQuery, Vue, React), and lots of WordPress sites. 
            I am a musician and singer in as many musical projects as time will allow. Currently, I sing and play guitar in Skeksis and 
            Gamma Goblin both based in Wichita Falls, TX. I'm an aspiring filmmaker. I've shot more projects than I've finished but I'll 
            post projects that I've finished. I am a visual artist dabbling mostly in photography, drawing, and 3d digital stuff (Blender).
          </p>
        </section>
      </div>
    </div>
  )
}

export default App
