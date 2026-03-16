const fs = require('fs');
const path = require('path');

const map = {
    'HiOutlineMail': 'Mail',
    'HiOutlinePhone': 'Phone',
    'HiOutlineLocationMarker': 'MapPin',
    'FaInstagram': 'Instagram',
    'FaFacebookF': 'Facebook',
    'FaTwitter': 'Twitter',
    'FaYoutube': 'Youtube',
    'FaWhatsapp': 'MessageCircle',
    'HiOutlineSearch': 'Search',
    'HiOutlineShoppingBag': 'ShoppingBag',
    'HiOutlineHeart': 'Heart',
    'HiOutlineUser': 'User',
    'HiOutlineMenu': 'Menu',
    'HiOutlineX': 'X',
    'HiX': 'X',
    'HiOutlineStar': 'Star',
    'HiStar': 'Star',
    'HiOutlineCamera': 'Camera',
    'HiOutlineThumbUp': 'ThumbsUp',
    'HiOutlineLogout': 'LogOut',
    'HiOutlineShieldCheck': 'ShieldCheck',
    'HiOutlineDotsHorizontal': 'MoreHorizontal',
    'HiOutlineRefresh': 'RefreshCw',
    'HiOutlineChevronRight': 'ChevronRight',
    'HiOutlineCreditCard': 'CreditCard',
    'HiOutlineTruck': 'Truck',
    'HiOutlineMinus': 'Minus',
    'HiOutlinePlus': 'Plus',
    'HiOutlineTrash': 'Trash2',
    'HiOutlineArrowRight': 'ArrowRight',
    'HiOutlineTag': 'Tag',
    'HiOutlineAdjustments': 'SlidersHorizontal',
    'HiOutlineChevronDown': 'ChevronDown',
    'HiOutlineChevronUp': 'ChevronUp',
    'HiOutlineCheckCircle': 'CheckCircle',
    'HiOutlineArrowLeft': 'ArrowLeft',
    'HiOutlineLockClosed': 'Lock',
    'HiOutlineCube': 'Package',
    'HiOutlineClock': 'Clock'
};

function f(d) {
    const files = fs.readdirSync(d);
    files.forEach(file => {
        const p = path.join(d, file);
        if (fs.statSync(p).isDirectory()) {
            f(p);
        } else if (p.endsWith('.jsx')) {
            let c = fs.readFileSync(p, 'utf-8');
            let hasChanges = false;
            
            let lucideSet = new Set();
            
            // extract imports
            const lines = c.split('\n');
            const newLines = [];
            lines.forEach(line => {
                if (line.includes('from \'react-icons/hi\'') || line.includes('from \'react-icons/fa\'')) {
                    hasChanges = true;
                    // match words inside { }
                    const match = line.match(/\{([^}]+)\}/);
                    if (match) {
                        match[1].split(',').forEach(item => {
                            const icon = item.trim();
                            if (map[icon]) lucideSet.add(map[icon]);
                        });
                    }
                } else {
                    newLines.push(line);
                }
            });
            
            if (hasChanges) {
                // generate import line
                const importLine = "import { " + Array.from(lucideSet).join(', ') + " } from 'lucide-react';";
                // find the last import line or just index 0
                let insertIdx = 0;
                for (let i = 0; i < newLines.length; i++) {
                    if (newLines[i].startsWith('import ')) {
                        insertIdx = i + 1;
                    }
                }
                newLines.splice(insertIdx, 0, importLine);
                
                c = newLines.join('\n');
                
                // replace all uses
                for (const oldIcon of Object.keys(map)) {
                    let newIcon = map[oldIcon];
                    const regex = new RegExp(`\\b${oldIcon}\\b`, 'g');
                    
                    if (oldIcon === 'HiStar') {
                        c = c.replace(/<HiStar(.*?)\/?>/g, `<Star fill="currentColor"$1 />`);
                    } else if (oldIcon === 'FaFacebookF') {
                        c = c.replace(/<FaFacebookF(.*?)\/?>/g, `<Facebook fill="currentColor" strokeWidth={0}$1 />`);
                    } else if (oldIcon === 'FaYoutube') {
                        c = c.replace(/<FaYoutube(.*?)\/?>/g, `<Youtube fill="currentColor" strokeWidth={0}$1 />`);
                    } else if (oldIcon === 'FaTwitter') {
                        c = c.replace(/<FaTwitter(.*?)\/?>/g, `<Twitter fill="currentColor" strokeWidth={0}$1 />`);
                    }
                    else {
                        c = c.replace(regex, newIcon);
                    }
                }
                
                fs.writeFileSync(p, c, 'utf-8');
                console.log('Updated ' + p);
            }
        }
    });
}

f('src');
