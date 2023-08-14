import logo from '../assets/logo.png'
import '../styles/Banner.css'

function Banner() {
	const title = 'CoinHarbor'
	return (
		<div className='banner'>
			<img src={logo} alt='CoinHarbor' className='logo' />
			<h1 className='title'>{title}</h1>
		</div>
	)
}

export default Banner