import logo from '../assets/bitcoin_logo.png'
import '../styles/Banner.css'

function Banner() {
	const title = 'Exchange'
	return (
		<div className='banner'>
			<img src={logo} alt='Exchange' className='logo' />
			<h1 className='title'>{title}</h1>
		</div>
	)
}

export default Banner