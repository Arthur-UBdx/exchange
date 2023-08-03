import logo from '../assets/bitcoin_logo.png'
import '../styles/Banner.css'

function Banner() {
	const title = 'Exchange'
	return (
		<div className='lmj-banner'>
			<img src={logo} alt='Exchange' className='lmj-logo' />
			<h1 className='lmj-title'>{title}</h1>
		</div>
	)
}

export default Banner